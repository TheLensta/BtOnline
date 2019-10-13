import { Packet, UDPPacket } from 'modloader64_api/ModLoaderDefaultImpls';
import * as API from 'modloader64_api/BT/Imports';

export class SyncStorage extends Packet {
  game_flags: Buffer;
  constructor(lobby: string, game_flags: Buffer) {
    super('SyncStorage', 'BtOnline', lobby, false);
    this.game_flags = game_flags;
  }
}

export class SyncBuffered extends Packet {
  value: Buffer;
  constructor(lobby: string, header: string, value: Buffer, persist: boolean) {
    super(header, 'BtOnline', lobby, persist);
    this.value = value;
  }
}

export class SyncNumbered extends Packet {
  value: number;
  constructor(lobby: string, header: string, value: number, persist: boolean) {
    super(header, 'BtOnline', lobby, persist);
    this.value = value;
  }
}