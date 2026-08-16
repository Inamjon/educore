import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('foundation', '0011_seed_platform_settings_permission'),
        ('groups', '0003_rls'),
        ('student', '0004_fix_updated_at_trigger_timing'),
    ]

    operations = [
        # Same implicit-schema-creation gap every prior app's 0001 closes —
        # see student/migrations/0001_initial.py.
        migrations.RunSQL(
            sql="CREATE SCHEMA IF NOT EXISTS exams;",
            reverse_sql="DROP SCHEMA IF EXISTS exams CASCADE;",
        ),
        migrations.CreateModel(
            name='Exam',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(editable=False)),
                ('deleted_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('title', models.CharField(max_length=255)),
                ('date', models.DateField()),
                ('start_time', models.TimeField()),
                ('duration_minutes', models.PositiveSmallIntegerField(default=90)),
                ('room', models.CharField(blank=True, max_length=100, null=True)),
                ('max_score', models.PositiveSmallIntegerField(default=100)),
                ('question_count', models.PositiveSmallIntegerField(default=0)),
                ('status', models.CharField(choices=[('scheduled', 'Scheduled'), ('completed', 'Completed'), ('cancelled', 'Cancelled')], default='scheduled', max_length=20)),
                ('created_by', models.UUIDField(blank=True, null=True)),
                ('group', models.ForeignKey(db_column='group_id', on_delete=django.db.models.deletion.CASCADE, related_name='exams', to='groups.group')),
                ('organization', models.ForeignKey(db_column='organization_id', on_delete=django.db.models.deletion.CASCADE, to='foundation.organization')),
            ],
            options={
                'db_table': '"exams"."exams"',
            },
        ),
        migrations.CreateModel(
            name='ExamResult',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(editable=False)),
                ('deleted_at', models.DateTimeField(blank=True, default=None, null=True)),
                ('score', models.PositiveSmallIntegerField(blank=True, null=True)),
                ('graded_by', models.UUIDField(blank=True, null=True)),
                ('graded_at', models.DateTimeField(blank=True, null=True)),
                ('exam', models.ForeignKey(db_column='exam_id', on_delete=django.db.models.deletion.CASCADE, related_name='results', to='exams.exam')),
                ('organization', models.ForeignKey(db_column='organization_id', on_delete=django.db.models.deletion.CASCADE, to='foundation.organization')),
                ('student_profile', models.ForeignKey(db_column='student_profile_id', on_delete=django.db.models.deletion.CASCADE, related_name='exam_results', to='student.studentprofile')),
            ],
            options={
                'db_table': '"exams"."exam_results"',
            },
        ),
        migrations.AddIndex(
            model_name='exam',
            index=models.Index(condition=models.Q(('deleted_at__isnull', True)), fields=['group', 'date'], name='idx_exams_group_date'),
        ),
        migrations.AddIndex(
            model_name='exam',
            index=models.Index(condition=models.Q(('deleted_at__isnull', True)), fields=['organization', 'status'], name='idx_exams_org_status'),
        ),
        migrations.AddConstraint(
            model_name='exam',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('group', 'date', 'start_time'), name='uq_exams_group_date_start'),
        ),
        migrations.AddConstraint(
            model_name='exam',
            constraint=models.CheckConstraint(condition=models.Q(('max_score__gt', 0)), name='chk_exams_max_score'),
        ),
        migrations.AddConstraint(
            model_name='exam',
            constraint=models.CheckConstraint(condition=models.Q(('duration_minutes__gt', 0)), name='chk_exams_duration'),
        ),
        migrations.AddIndex(
            model_name='examresult',
            index=models.Index(condition=models.Q(('deleted_at__isnull', True)), fields=['exam'], name='idx_exam_results_exam'),
        ),
        migrations.AddIndex(
            model_name='examresult',
            index=models.Index(condition=models.Q(('deleted_at__isnull', True)), fields=['student_profile'], name='idx_exam_results_student'),
        ),
        migrations.AddConstraint(
            model_name='examresult',
            constraint=models.UniqueConstraint(condition=models.Q(('deleted_at__isnull', True)), fields=('exam', 'student_profile'), name='uq_exam_results_exam_student'),
        ),
    ]
