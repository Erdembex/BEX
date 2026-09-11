import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { Screen } from '@/components/common/Screen';
import { CompletedTask } from '@/types';
import { formatShortDate } from '@/lib/dateUtils';
import { COMPLETED_TASKS_PREVIEW_LIMIT } from '@/features/portfolio/profileLimits';
import { AuthenticatedImage } from '@/components/common/AuthenticatedImage';
import { ImageViewerModal } from '@/components/common/ImageViewerModal';
import { Typography, Spacing, Radius, createThemedStyles, useThemeColors } from '@/theme';
import { useTranslation } from '@/i18n';

function TaskRow({
  task,
  onPreviewImage,
}: {
  task: CompletedTask;
  onPreviewImage?: (task: CompletedTask) => void;
}) {
  const styles = useScreenStyles();
  const { t } = useTranslation();
  const thumb = task.previewImageUrl ? (
    <AuthenticatedImage uri={task.previewImageUrl} style={styles.thumb} />
  ) : (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <Text style={styles.thumbEmoji}>✓</Text>
    </View>
  );

  return (
    <View style={styles.row}>
      {task.previewImageUrl && onPreviewImage ? (
        <TouchableOpacity activeOpacity={0.88} onPress={() => onPreviewImage(task)}>
          {thumb}
        </TouchableOpacity>
      ) : (
        thumb
      )}
      <View style={styles.rowBody}>
        <Text style={styles.taskTitle} numberOfLines={2}>
          {task.taskTitle}
        </Text>
        <Text style={styles.taskMeta}>
          {formatShortDate(task.completedAt)}
          {task.imageCount > 0 ? ` · ${t('completedTasksList.imageCount', { count: task.imageCount })}` : ''}
        </Text>
      </View>
    </View>
  );
}

interface CompletedTasksModalProps {
  visible: boolean;
  onClose: () => void;
  tasks: CompletedTask[];
  totalCount?: number;
}

export function CompletedTasksModal({
  visible,
  onClose,
  tasks,
  totalCount,
  onPreviewImage,
}: CompletedTasksModalProps & {
  onPreviewImage?: (task: CompletedTask) => void;
}) {
  const Colors = useThemeColors();
  const styles = useScreenStyles();
  const total = totalCount ?? tasks.length;
  const { t } = useTranslation();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{t('completedTasksList.modalTitle', { count: total })}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeText}>{t('completedTasksList.close')}</Text>
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={styles.modalScroll}>
          {tasks.length > 0 ? (
            tasks.map((task) => (
              <TaskRow
                key={task.applicationId}
                task={task}
                onPreviewImage={task.previewImageUrl ? onPreviewImage : undefined}
              />
            ))
          ) : (
            <Text style={styles.emptyText}>{t('completedTasksList.empty')}</Text>
          )}
        </ScrollView>
      </Screen>
    </Modal>
  );
}

interface CompletedTasksListProps {
  tasks: CompletedTask[];
  totalCount?: number;
  previewLimit?: number;
  compact?: boolean;
}

export function CompletedTasksList({
  tasks,
  totalCount,
  previewLimit = COMPLETED_TASKS_PREVIEW_LIMIT,
  compact = false,
}: CompletedTasksListProps) {
  const styles = useScreenStyles();
  const [showAll, setShowAll] = useState(false);
  const [previewTask, setPreviewTask] = useState<CompletedTask | null>(null);
  const total = totalCount ?? tasks.length;
  const preview = useMemo(() => tasks.slice(0, previewLimit), [tasks, previewLimit]);
  const hiddenCount = Math.max(0, total - preview.length);
  const { t } = useTranslation();

  if (tasks.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyText}>{t('completedTasksList.empty')}</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.wrap}>
        <Text style={styles.title}>{t('completedTasksList.title')}</Text>
        {!compact ? (
          <Text style={styles.subtitle}>
            {t('completedTasksList.subtitle', { count: Math.min(preview.length, previewLimit) })}
          </Text>
        ) : null}
        <View style={styles.list}>
          {preview.map((task) => (
            <TaskRow
              key={task.applicationId}
              task={task}
              onPreviewImage={task.previewImageUrl ? setPreviewTask : undefined}
            />
          ))}
        </View>
        {hiddenCount > 0 ? (
          <TouchableOpacity style={styles.moreBtn} onPress={() => setShowAll(true)}>
            <Text style={styles.moreText}>
              {t('completedTasksList.moreTasks', { count: hiddenCount, total })}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <CompletedTasksModal
        visible={showAll}
        onClose={() => setShowAll(false)}
        tasks={tasks}
        totalCount={total}
      />
    </>
  );
}

interface CompletedTasksStatProps {
  count: number;
  tasks: CompletedTask[];
  totalCount?: number;
}

/** Hero alanındaki "X tamamlanan görev" metni — dokununca tam listeyi açar */
export function CompletedTasksStat({ count, tasks, totalCount }: CompletedTasksStatProps) {
  const styles = useScreenStyles();
  const [showAll, setShowAll] = useState(false);
  const total = totalCount ?? count;
  const { t } = useTranslation();

  if (count <= 0) {
    return <Text style={styles.statMuted}>{t('completedTasksList.statZero')}</Text>;
  }

  return (
    <>
      <TouchableOpacity onPress={() => setShowAll(true)} activeOpacity={0.7}>
        <Text style={styles.statLink}>{t('completedTasksList.statLabel', { count })}</Text>
      </TouchableOpacity>

      <CompletedTasksModal
        visible={showAll}
        onClose={() => setShowAll(false)}
        tasks={tasks}
        totalCount={total}
      />
    </>
  );
}

const useScreenStyles = createThemedStyles((Colors) => ({
  wrap: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing[2],
  },
  title: { ...Typography.labelLarge, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 20 },
  list: { gap: Spacing[2] },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
  },
  thumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  thumbEmoji: { fontSize: 18 },
  rowBody: { flex: 1, gap: 2 },
  taskTitle: { ...Typography.labelMedium, color: Colors.textPrimary },
  taskMeta: { ...Typography.caption, color: Colors.textMuted },
  moreBtn: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing[1],
  },
  moreText: { ...Typography.labelMedium, color: Colors.primary },
  emptyBox: {
    width: '100%',
    padding: Spacing[4],
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  emptyText: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center' },
  statMuted: { ...Typography.bodySmall, color: Colors.textMuted },
  statLink: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  modalSafe: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { ...Typography.headingSmall, color: Colors.textPrimary },
  closeText: { ...Typography.labelMedium, color: Colors.primary },
  modalScroll: { padding: Spacing[5], paddingBottom: Spacing[10], gap: Spacing[1] },
}));
