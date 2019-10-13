import {
  EventsClient,
  EventServerJoined,
  EventServerLeft,
  EventHandler,
  EventsServer,
} from 'modloader64_api/EventHandler';
import { IModLoaderAPI, IPlugin } from 'modloader64_api/IModLoaderAPI';
import {
  INetworkPlayer,
  LobbyData,
  NetworkHandler,
  ServerNetworkHandler,
} from 'modloader64_api/NetworkHandler';
import { InjectCore } from 'modloader64_api/CoreInjection';
import { Packet } from 'modloader64_api/ModLoaderDefaultImpls';
import * as API from 'modloader64_api/BT/Imports';
import * as Net from './network/Imports';

export class BtOnline implements IPlugin {
  ModLoader = {} as IModLoaderAPI;
  core_dependency = 'BanjoTooie';
  name = 'BtOnline';

  @InjectCore() core!: API.IBTCore;

  // Storage Variables
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
    pData = new Net.SyncBuffered(this.ModLoader.clientLobby, 'SyncGameFlags', bufData, false);
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
  onServer_LobbyCreate(lobby: string) {
    this.ModLoader.lobbyManager.createLobbyStorage(
      lobby, 
      this, 
      new Net.DatabaseServer()
    );
  }

  @EventHandler(EventsClient.ON_LOBBY_JOIN)
  onClient_LobbyJoin(lobby: LobbyData): void {
    this.cDB = new Net.DatabaseClient();
    let pData = new Packet('Request_Storage', 'BtOnline', this.ModLoader.clientLobby, false);
    this.ModLoader.clientSide.sendPacket(pData);
  }

  @EventHandler(EventsServer.ON_LOBBY_JOIN)
  onServer_LobbyJoin(evt: EventServerJoined) {
    let storage: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(evt.lobby, this) as Net.DatabaseServer;
    
  }

  @EventHandler(EventsServer.ON_LOBBY_LEAVE)
  onServer_LobbyLeave(evt: EventServerLeft) {
    let storage: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(evt.lobby, this) as Net.DatabaseServer;
    
  }

  @EventHandler(EventsClient.ON_SERVER_CONNECTION)
  onClient_ServerConnection(evt: any) {
    
  }

  @EventHandler(EventsClient.ON_PLAYER_JOIN)
  onClient_PlayerJoin(player: INetworkPlayer) {

  }

  @EventHandler(EventsClient.ON_PLAYER_LEAVE)
  onClient_PlayerLeave(player: INetworkPlayer) {
    
  }

  // #################################################
  // ##  Server Receive Packets
  // #################################################

  @ServerNetworkHandler('Request_Storage')
  onServer_RequestStorage(packet: Packet): void {
    this.ModLoader.logger.info('[Server] Sending: {Lobby Storage}');
    let sDB: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
    let pData = new Net.SyncStorage(packet.lobby, sDB.game_flags);
    this.ModLoader.serverSide.sendPacketToSpecificPlayer(pData, packet.player);
  }
  
  @ServerNetworkHandler('SyncGameFlags')
  onServer_SyncGameFlags(packet: Net.SyncBuffered) {
    this.ModLoader.logger.info('[Server] Received: {Game Flags}');

    let sDB: Net.DatabaseServer = this.ModLoader.lobbyManager.getLobbyStorage(packet.lobby, this) as Net.DatabaseServer;
    let data: Buffer = sDB.game_flags;
    let count: number = data.byteLength;
    let i = 0;
    let needUpdate = false;

    for (i = 0; i < count; i++) {
      if (data[i] === packet.value[i]) continue;
      data[i] |= packet.value[i];
      needUpdate = true;
    }

    if (!needUpdate) return;

    sDB.game_flags = data;

    let pData = new Net.SyncBuffered(packet.lobby, 'SyncGameFlags', data, true);
    this.ModLoader.serverSide.sendPacket(pData);

    this.ModLoader.logger.info('[Server] Updated: {Game Flags}');
  }

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
}