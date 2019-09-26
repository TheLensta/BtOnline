import {
  EventsClient,
  EventServerJoined,
  EventServerLeft,
  EventHandler,
  EventsServer,
} from 'modloader64_api/EventHandler';
import { IModLoaderAPI, IPlugin } from 'modloader64_api/IModLoaderAPI';
import {
  ILobbyStorage,
  INetworkPlayer,
  LobbyData,
  NetworkHandler,
  ServerNetworkHandler,
} from 'modloader64_api/NetworkHandler';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { LobbyVariable } from 'modloader64_api/LobbyVariable';
import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import * as API from 'modloader64_api/BT/Imports';
import * as Net from './network/Imports';

export class BtOnline implements IPlugin {
  ModLoader = {} as IModLoaderAPI;
  core_dependency = 'BanjoTooie';
  name = 'BtOnline';

  @InjectCore() core!: API.IBTCore;

  // Storage Variables
  @LobbyVariable('BtOnline:storage')
  sDB = new Net.DatabaseServer();
  cDB = new Net.DatabaseClient();

  // Puppet Handler
  // protected pMgr!: Puppet.PuppetManager;

  // Helpers
  /* None Yet! */

  handle_game_flags(bufData: Buffer, bufStorage: Buffer) {
    // Initializers
    let pData: Net.SyncBuffered;
    let i: number;
    let count = 0;
    let needUpdate = false;

    bufData = this.core.save.game_flags.get_all();
    bufStorage = this.cDB.game_flags;
    count = bufData.byteLength;
    needUpdate = false;
    for (i = 0; i < count; i++) {
      if (bufData[i] === bufStorage[i]) continue;

      bufData[i] |= bufStorage[i];
      this.core.save.game_flags.set(i, bufData[i]);
      needUpdate = true;
    }

    if (!needUpdate) return;

    this.cDB.game_flags = bufData;
    pData = new Net.SyncBuffered('SyncGameFlags', bufData, false);
    this.ModLoader.clientSide.sendPacket(pData);
  }

  constructor() {}

  preinit(): void {
    // this.pMgr = new Puppet.PuppetManager();
  }

  init(): void {
    
  }

  postinit(): void {
    // Puppet Manager Inject
    // this.pMgr.postinit(
    //   this.ModLoader.emulator,
    //   this.core,
    //   this.ModLoader.me,
    //   this.ModLoader
    // );

    // this.ModLoader.logger.info('Puppet manager activated.');
  }

  onTick(): void {
    if (!this.core.isPlaying() /*|| this.core.runtime.is_cutscene()*/) return;
    
    // Initializers
    let bufStorage: Buffer;
    let bufData: Buffer;

    this.handle_game_flags(bufData!, bufStorage!);
  }

  @EventHandler(EventsClient.ON_INJECT_FINISHED)
  onClient_InjectFinished(evt: any) {
    
  }

  @EventHandler(EventsServer.ON_LOBBY_CREATE)
  onServer_LobbyCreate(storage: ILobbyStorage) {
    this.sDB = new Net.DatabaseServer();
  }

  @EventHandler(EventsClient.ON_LOBBY_JOIN)
  onClient_LobbyJoin(lobby: LobbyData): void {
    this.cDB = new Net.DatabaseClient();
    let pData = new Packet('Request_Storage', 'BtOnline', false);
    this.ModLoader.clientSide.sendPacket(pData);
  }

  @EventHandler(EventsServer.ON_LOBBY_JOIN)
  onServer_LobbyJoin(evt: EventServerJoined) {
    let storage: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(
      evt.lobby
    ).data['BtOnline:storage'].sDB as Net.DatabaseServer;
    // storage.players[evt.player.uuid] = -1;
    // storage.playerInstances[evt.player.uuid] = evt.player;
  }

  @EventHandler(EventsServer.ON_LOBBY_LEAVE)
  onServer_LobbyLeave(evt: EventServerLeft) {
    let lobbyStorage = this.ModLoader.lobbyManager.getLobbyStorage(evt.lobby);
    if (lobbyStorage === null) return;
    let storage = lobbyStorage.data['BtOnline:storage'].sDB as Net.DatabaseServer;
    // delete storage.players[evt.player.uuid];
    // delete storage.playerInstances[evt.player.uuid];
  }

  @EventHandler(EventsClient.ON_SERVER_CONNECTION)
  onClient_ServerConnection(evt: any) {
    // this.pMgr.reset();
    // if (this.core.runtime === undefined || !this.core.isPlaying) return;
    // let pData = new Net.SyncLocation(this.curLevel, this.curScene)
    // this.ModLoader.clientSide.sendPacket(pData);
  }

  @EventHandler(EventsClient.ON_PLAYER_JOIN)
  onClient_PlayerJoin(player: INetworkPlayer) {
    // this.pMgr.registerPuppet(player);
  }

  @EventHandler(EventsClient.ON_PLAYER_LEAVE)
  onClient_PlayerLeave(player: INetworkPlayer) {
    // this.pMgr.unregisterPuppet(player);
  }

  // #################################################
  // ##  Server Receive Packets
  // #################################################

  @ServerNetworkHandler('Request_Storage')
  onServer_RequestStorage(packet: Packet): void {
    this.ModLoader.logger.info('[Server] Sending: {Lobby Storage}');
    let pData = new Net.SyncStorage(
      this.sDB.game_flags
    );
    this.ModLoader.serverSide.sendPacketToSpecificPlayer(pData, packet.player);
  }
  
  @ServerNetworkHandler('SyncGameFlags')
  onServer_SyncGameFlags(packet: Net.SyncBuffered) {
    this.ModLoader.logger.info('[Server] Received: {Game Flags}');

    let data: Buffer = this.sDB.game_flags;
    let count: number = data.byteLength;
    let i = 0;
    let needUpdate = false;

    for (i = 0; i < count; i++) {
      if (data[i] === packet.value[i]) continue;
      data[i] |= packet.value[i];
      needUpdate = true;
    }

    if (!needUpdate) return;

    this.sDB.game_flags = data;

    let pData = new Net.SyncBuffered('SyncGameFlags', data, true);
    pData.lobby = packet.lobby; // temporary
    this.ModLoader.serverSide.sendPacket(pData);

    this.ModLoader.logger.info('[Server] Updated: {Game Flags}');
  }

  // Puppet Tracking

  // @ServerNetworkHandler('SyncLocation')
  // onServer_SyncLocation(packet: Net.SyncLocation) {
    
  //   let pMsg = 'Player[' + packet.player.nickname + ']';
  //   let lMsg = 'Level[' + API.LevelType[packet.level] + ']';
  //   let sMsg = 'Scene[' + API.SceneType[packet.scene] + ']';
  //   this.sDB.players[packet.player.uuid] = packet.scene;
  //   this.ModLoader.logger.info('[Server] Received: {Player Scene}');
  //   this.ModLoader.logger.info('[Server] Updated: ' + pMsg + ' to ' + sMsg + ' of ' + lMsg);

  //   if (packet.level === API.LevelType.UNKNOWN ||
  //       packet.scene === API.SceneType.UNKNOWN) return;
      
    
  //   let storage: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(
  //     packet.lobby
  //   ).data['BtOnline:storage'].sDB as Net.DatabaseServer;
    
  //   this.check_db_instance(storage, packet.level, packet.scene);
  // }

  // @ServerNetworkHandler('SyncPuppet')
  // onServer_SyncPuppet(packet: Net.SyncPuppet) {
  //   Object.keys(this.sDB.players).forEach((key: string) => {
  //     if (this.sDB.players[key] !== this.sDB.players[packet.player.uuid]) {
  //       return;
  //     }

  //     if (!this.sDB.playerInstances.hasOwnProperty(key)) return;
  //     if (this.sDB.playerInstances[key].uuid === packet.player.uuid) {
  //       return;
  //     }

  //     this.ModLoader.serverSide.sendPacketToSpecificPlayer(
  //       packet,
  //       this.sDB.playerInstances[key]
  //     );
  //   });
  // }

  // Level Tracking

  // #################################################
  // ##  Client Receive Packets
  // #################################################

  @NetworkHandler('SyncStorage')
  onClient_SyncStorage(packet: Net.SyncStorage): void {
    this.ModLoader.logger.info('[Client] Received: {Lobby Storage}');
    this.cDB.game_flags = packet.game_flags;
  }
  
  @NetworkHandler('SyncGameFlags')
  onClient_SyncGameFlags(packet: Net.SyncBuffered) {
    this.ModLoader.logger.info('[Client] Received: {Game Flags}');

    let data: Buffer = this.cDB.game_flags;
    let count: number = data.byteLength;
    let i = 0;
    let needUpdate = false;

    for (i = 0; i < count; i++) {
      if (data[i] === packet.value[i]) continue;
      data[i] |= packet.value[i];
      needUpdate = true;
    }

    if (!needUpdate) return;
      
    this.cDB.game_flags = data;

    this.ModLoader.logger.info('[Client] Updated: {Game Flags}');
  }
  
  // Puppet Tracking

  // @NetworkHandler('Request_Scene')
  // onClient_RequestScene(packet: Packet) {
  //   if (this.core.runtime === undefined || !this.core.isPlaying) return;
  //   let pData = new Net.SyncLocation(this.curLevel, this.curScene);
  //   this.ModLoader.clientSide.sendPacketToSpecificPlayer(pData, packet.player);
  // }

  // @NetworkHandler('SyncLocation')
  // onClient_SyncLocation(packet: Net.SyncLocation) {
  //   let pMsg = 'Player[' + packet.player.nickname + ']';
  //   let lMsg = 'Level[' + API.LevelType[packet.level] + ']';
  //   let sMsg = 'Scene[' + API.SceneType[packet.scene] + ']';
  //   this.pMgr.changePuppetScene(packet.player, packet.scene);
  //   this.ModLoader.logger.info('[Client] Received: {Player Scene}');
  //   this.ModLoader.logger.info('[Client] Updated: ' + pMsg + ' to ' + sMsg + ' of ' + lMsg);
    
  //   if (packet.level === API.LevelType.UNKNOWN ||
  //       packet.scene === API.SceneType.UNKNOWN) return;
    
  //   this.check_db_instance(this.cDB, packet.level, packet.scene);
  // }

  // @NetworkHandler('SyncPuppet')
  // onClient_SyncPuppet(packet: Net.SyncPuppet) {
  //   this.pMgr.handlePuppet(packet);
  // }

  // Level Tracking


}