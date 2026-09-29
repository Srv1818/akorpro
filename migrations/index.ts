import * as migration_20260923_141041_initial from './20260923_141041_initial';
import * as migration_20260929_072717_drop_seo_meta from './20260929_072717_drop_seo_meta';
import * as migration_20260929_074806_song_views from './20260929_074806_song_views';
import * as migration_20260929_082319_drop_discover from './20260929_082319_drop_discover';
import * as migration_20260929_082339_editor_picks from './20260929_082339_editor_picks';

export const migrations = [
  {
    up: migration_20260923_141041_initial.up,
    down: migration_20260923_141041_initial.down,
    name: '20260923_141041_initial',
  },
  {
    up: migration_20260929_072717_drop_seo_meta.up,
    down: migration_20260929_072717_drop_seo_meta.down,
    name: '20260929_072717_drop_seo_meta',
  },
  {
    up: migration_20260929_074806_song_views.up,
    down: migration_20260929_074806_song_views.down,
    name: '20260929_074806_song_views',
  },
  {
    up: migration_20260929_082319_drop_discover.up,
    down: migration_20260929_082319_drop_discover.down,
    name: '20260929_082319_drop_discover',
  },
  {
    up: migration_20260929_082339_editor_picks.up,
    down: migration_20260929_082339_editor_picks.down,
    name: '20260929_082339_editor_picks'
  },
];
