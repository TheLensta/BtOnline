export class Database {
  game_flags: Buffer = Buffer.alloc(0xAF);
}
  
export class DatabaseClient extends Database {}
  
export class DatabaseServer extends Database {}