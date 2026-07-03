-- One-time seed: the 11 built-in device categories (labels from js/i18n.js).
INSERT INTO categories (created_at, slug, label, label_ar) VALUES
 ('2026-07-03T14:00:01Z','diagnostic','Diagnostic Devices','أجهزة التشخيص'),
 ('2026-07-03T14:00:02Z','imaging','Imaging & Ultrasound','التصوير والإيكو'),
 ('2026-07-03T14:00:03Z','endoscopy','Endoscopy','التنظير'),
 ('2026-07-03T14:00:04Z','surgical','Surgical Equipment','المعدات الجراحية'),
 ('2026-07-03T14:00:05Z','orthopedics','Orthopedics','جراحة العظام'),
 ('2026-07-03T14:00:06Z','monitoring','Patient Monitoring','مراقبة المرضى'),
 ('2026-07-03T14:00:07Z','cardiology','Cardiology','أمراض القلب'),
 ('2026-07-03T14:00:08Z','neurology','Neurology','طب الأعصاب'),
 ('2026-07-03T14:00:09Z','lab','Laboratory Equipment','معدات المختبرات'),
 ('2026-07-03T14:00:10Z','sterilization','Sterilization (CSSD)','التعقيم (CSSD)'),
 ('2026-07-03T14:00:11Z','hospital','Hospital Equipment','معدات المشافي');
