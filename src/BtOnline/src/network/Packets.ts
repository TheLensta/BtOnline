import { Packet, UDPPacket } from 'modloader64_api/ModLoaderDefaultImpls';
import * as API from 'modloader64_api/BT/Imports';

export class SyncStorage extends Packet {
  game_flags: Buffer;
  constructor(
    game_flags: Buffer,
  ) {
    super('SyncStorage', 'BtOnline', false);
    this.game_flags = game_flags;
  }
}

export class SyncBuffered extends Packet {
  value: Buffer;
  constructor(header: string, value: Buffer, persist: boolean) {
    super(header, 'BtOnline', persist);
    this.value = value;
  }
}

export class SyncNumbered extends Packet {
  value: number;
  constructor(header: string, value: number, persist: boolean) {
    super(header, 'BtOnline', persist);
    this.value = value;
  }
}

// #################################################
// ##  Puppet Tracking
// #################################################

// export class SyncPuppet extends UDPPacket {
//   puppet: PData.IData;
//   constructor(value: PData.Data) {
//     super('SyncPuppet', 'BtOnline', false);
//     this.puppet = value;
//   }
// }

// export class SyncLocation extends Packet {
//   level: number;
//   scene: number;
//   constructor(level: number, scene: number) {
//     super('SyncLocation', 'BtOnline', true);
//     this.level = level;
//     this.scene = scene;
//   }
// }

// #################################################
// ##  Level Tracking
// #################################################

// export class SyncLevelNumbered extends Packet {
//   level: number;
//   value: number;
//   constructor(
//     header: string,
//     level: number,
//     value: number,
//     persist: boolean
//   ) {
//     super(header, 'BtOnline', persist);
//     this.level = level;
//     this.value = value;
//   }
// }

// #################################################
// ##  Scene Tracking
// #################################################

// export class SyncSceneNumbered extends Packet {
//   level: number;
//   scene: number;
//   value: number;
//   constructor(
//     header: string,
//     level: number,
//     scene: number,
//     value: number,
//     persist: boolean
//   ) {
//     super(header, 'BtOnline', persist);
//     this.level = level;
//     this.scene = scene;
//     this.value = value;
//   }
// }