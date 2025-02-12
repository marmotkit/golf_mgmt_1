-- 插入預設獎項類型
INSERT INTO award_types (name, description, has_category, has_score, has_rank, has_hole_number, max_winners, is_active)
VALUES 
    ('技術獎', '最佳技術表現獎項', true, true, false, false, null, true),
    ('跳跳獎', '最大進步獎項', false, false, false, false, null, true),
    ('BB獎', '特殊表現獎項', false, false, false, false, null, true),
    ('總桿冠軍', '最佳總桿成績', true, true, true, false, 1, true),
    ('淨桿獎', '最佳淨桿成績', true, true, true, false, 3, true),
    ('Eagle獎', '老鷹成就獎', false, false, false, true, null, true),
    ('HIO', '一桿進洞', false, false, false, true, null, true),
    ('其他獎項', '臨時性或特殊獎項', false, false, false, false, null, true); 