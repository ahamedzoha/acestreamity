import * as sqlite3 from 'sqlite3';

type DatabaseConfig = {
  path: string;
};

type Channel = {
  id?: number;
  name: string;
  ace_stream_id: string;
  description?: string;
  category?: string;
  language?: string;
  quality?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DatabaseService = {
  initialize: () => Promise<void>;
  getChannels: () => Promise<Channel[]>;
  getChannelById: (id: number) => Promise<Channel | null>;
  getChannelByAceId: (aceId: string) => Promise<Channel | null>;
  createChannel: (
    channel: Omit<Channel, 'id' | 'created_at' | 'updated_at'>
  ) => Promise<Channel>;
  updateChannel: (id: number, updates: Partial<Channel>) => Promise<Channel>;
  deleteChannel: (id: number) => Promise<void>;
  close: () => Promise<void>;
};

export function createDatabaseService(config: DatabaseConfig): DatabaseService {
  let db: sqlite3.Database;

  const initialize = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      db = new sqlite3.Database(config.path, (err) => {
        if (err) {
          reject(new Error(`Failed to open database: ${err.message}`));
          return;
        }

        // Create tables if they don't exist
        const createChannelsTable = `
          CREATE TABLE IF NOT EXISTS channels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ace_stream_id TEXT UNIQUE NOT NULL,
            description TEXT,
            category TEXT,
            language TEXT,
            quality TEXT,
            is_active BOOLEAN DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        const createStreamSessionsTable = `
          CREATE TABLE IF NOT EXISTS stream_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            channel_id INTEGER REFERENCES channels(id),
            session_token TEXT UNIQUE,
            hls_url TEXT,
            status TEXT,
            peers_count INTEGER DEFAULT 0,
            download_speed INTEGER DEFAULT 0,
            upload_speed INTEGER DEFAULT 0,
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `;

        db.run(createChannelsTable, (err) => {
          if (err) {
            reject(
              new Error(`Failed to create channels table: ${err.message}`)
            );
            return;
          }

          db.run(createStreamSessionsTable, (err) => {
            if (err) {
              reject(
                new Error(
                  `Failed to create stream_sessions table: ${err.message}`
                )
              );
              return;
            }

            console.log('✅ Database initialized successfully');
            resolve();
          });
        });
      });
    });
  };

  const getChannels = async (): Promise<Channel[]> => {
    return new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM channels ORDER BY created_at DESC',
        (err, rows: Channel[]) => {
          if (err) {
            reject(new Error(`Failed to get channels: ${err.message}`));
            return;
          }
          resolve(rows || []);
        }
      );
    });
  };

  const getChannelById = async (id: number): Promise<Channel | null> => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM channels WHERE id = ?',
        [id],
        (err, row: Channel) => {
          if (err) {
            reject(new Error(`Failed to get channel: ${err.message}`));
            return;
          }
          resolve(row || null);
        }
      );
    });
  };

  const getChannelByAceId = async (aceId: string): Promise<Channel | null> => {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM channels WHERE ace_stream_id = ?',
        [aceId],
        (err, row: Channel) => {
          if (err) {
            reject(
              new Error(`Failed to get channel by Ace ID: ${err.message}`)
            );
            return;
          }
          resolve(row || null);
        }
      );
    });
  };

  const createChannel = async (
    channel: Omit<Channel, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Channel> => {
    return new Promise((resolve, reject) => {
      const {
        name,
        ace_stream_id,
        description = null,
        category = null,
        language = null,
        quality = null,
        is_active = true,
      } = channel;

      const sql = `
        INSERT INTO channels (name, ace_stream_id, description, category, language, quality, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          name,
          ace_stream_id,
          description,
          category,
          language,
          quality,
          is_active,
        ],
        function (err) {
          if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
              reject(
                new Error('Channel with this Ace Stream ID already exists')
              );
            } else {
              reject(new Error(`Failed to create channel: ${err.message}`));
            }
            return;
          }

          // Get the created channel
          getChannelById(this.lastID)
            .then((channel) => {
              if (channel) {
                resolve(channel);
              } else {
                reject(new Error('Failed to retrieve created channel'));
              }
            })
            .catch(reject);
        }
      );
    });
  };

  const updateChannel = async (
    id: number,
    updates: Partial<Channel>
  ): Promise<Channel> => {
    return new Promise((resolve, reject) => {
      const allowedFields = [
        'name',
        'ace_stream_id',
        'description',
        'category',
        'language',
        'quality',
        'is_active',
      ];
      const updateFields = Object.keys(updates).filter((key) =>
        allowedFields.includes(key)
      );

      if (updateFields.length === 0) {
        reject(new Error('No valid fields to update'));
        return;
      }

      const setClause = updateFields.map((field) => `${field} = ?`).join(', ');
      const values = updateFields.map(
        (field) => updates[field as keyof Channel]
      );

      const sql = `
        UPDATE channels 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;

      db.run(sql, [...values, id], function (err) {
        if (err) {
          if (err.message.includes('UNIQUE constraint failed')) {
            reject(new Error('Channel with this Ace Stream ID already exists'));
          } else {
            reject(new Error(`Failed to update channel: ${err.message}`));
          }
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Channel not found'));
          return;
        }

        // Get the updated channel
        getChannelById(id)
          .then((channel) => {
            if (channel) {
              resolve(channel);
            } else {
              reject(new Error('Failed to retrieve updated channel'));
            }
          })
          .catch(reject);
      });
    });
  };

  const deleteChannel = async (id: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.run('DELETE FROM channels WHERE id = ?', [id], function (err) {
        if (err) {
          reject(new Error(`Failed to delete channel: ${err.message}`));
          return;
        }

        if (this.changes === 0) {
          reject(new Error('Channel not found'));
          return;
        }

        resolve();
      });
    });
  };

  const close = async (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (db) {
        db.close((err) => {
          if (err) {
            reject(new Error(`Failed to close database: ${err.message}`));
            return;
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  return {
    initialize,
    getChannels,
    getChannelById,
    getChannelByAceId,
    createChannel,
    updateChannel,
    deleteChannel,
    close,
  };
}
