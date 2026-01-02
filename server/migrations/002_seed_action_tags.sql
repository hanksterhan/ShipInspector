-- Seed baseline action tags
INSERT INTO action_tags (key, description, category) VALUES
    ('tanked', 'Player took a long time to decide', 'timing'),
    ('snap', 'Player acted very quickly', 'timing'),
    ('all_in', 'Player went all-in', 'action'),
    ('showed_1', 'Player showed one card', 'showdown'),
    ('showed_2', 'Player showed both cards', 'showdown'),
    ('mucked', 'Player mucked their cards', 'showdown'),
    ('table_talk', 'Player engaged in table talk', 'behavior'),
    ('misclick', 'Player indicated a misclick occurred', 'behavior')
ON CONFLICT (key) DO NOTHING;

