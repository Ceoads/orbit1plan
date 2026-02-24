import { useState } from "react";
import { startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTimelineTasks, type TimelineTask } from "@/hooks/useTimelineTasks";
import { TimelineDayView } from "./TimelineDayView";
import { TimelineWeekView } from "./TimelineWeekView";
import { AddTimelineTaskModal } from "./AddTimelineTaskModal";
import { EditTimelineTaskModal } from "./EditTimelineTaskModal";

interface Props {
  open: boolean;
  onClose: () => void;
}

type ViewMode = 'day' | 'week';

const CATEGORY_FILTERS = [
  { id: 'all', label: 'Tout' },
  { id: 'study', label: '📚 Études' },
  { id: 'sport', label: '💪 Sport' },
  { id: 'personal', label: '🏦 Perso' },
];

export const TimelineFullScreen = ({ open, onClose }: Props) => {
  const { tasks, createTask, toggleComplete, updateTask, deleteTask } = useTimelineTasks();
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { locale: fr, weekStartsOn: 1 }));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalDate, setAddModalDate] = useState<Date | undefined>();
  const [addModalHour, setAddModalHour] = useState<number | undefined>();
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);

  const handleAddTask = (hour?: number, date?: Date) => {
    setAddModalDate(date || (viewMode === 'day' ? selectedDate : undefined));
    setAddModalHour(hour);
    setShowAddModal(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
            onClick={onClose}
          />

          {/* Full screen panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-0 bg-background z-[1000] flex flex-col overflow-hidden"
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/20 flex-shrink-0 bg-background/80 backdrop-blur-xl">
              <button onClick={onClose} className="p-2 -ml-1 rounded-xl hover:bg-muted/50 transition-colors">
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>

              <h2 className="font-display font-bold text-base text-foreground">Timeline</h2>

              <div className="flex items-center gap-2">
                {/* View toggle - reference style */}
                <div className="flex bg-muted/60 rounded-xl p-0.5 border border-border/20">
                  {(['week', 'day'] as const).map(mode => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode === 'week' ? 'week' : 'day')}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                        (mode === 'week' ? 'week' : 'day') === viewMode
                          ? 'bg-card shadow-sm text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode === 'week' ? 'Semaine' : 'Jour'}
                    </button>
                  ))}
                </div>
                <button onClick={() => handleAddTask()} className="p-2 rounded-xl hover:bg-muted/50 transition-colors">
                  <Plus className="w-5 h-5 text-primary" />
                </button>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex gap-2 px-4 py-2.5 flex-shrink-0 overflow-x-auto">
              {CATEGORY_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === f.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border/20'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'day' ? (
                <TimelineDayView
                  tasks={tasks}
                  selectedDate={selectedDate}
                  onDateChange={setSelectedDate}
                  onAddTask={handleAddTask}
                  onTaskClick={setEditingTask}
                  onToggleComplete={toggleComplete}
                  categoryFilter={categoryFilter}
                />
              ) : (
                <TimelineWeekView
                  tasks={tasks}
                  weekStart={weekStart}
                  onWeekChange={setWeekStart}
                  onTaskClick={setEditingTask}
                  onAddTask={handleAddTask}
                  categoryFilter={categoryFilter}
                />
              )}
            </div>
          </motion.div>

          {/* Modals */}
          <AddTimelineTaskModal
            open={showAddModal}
            onClose={() => setShowAddModal(false)}
            onAdd={createTask}
            defaultDate={addModalDate}
            defaultHour={addModalHour}
          />

          <EditTimelineTaskModal
            open={!!editingTask}
            onClose={() => setEditingTask(null)}
            task={editingTask}
            onUpdate={updateTask}
            onDelete={deleteTask}
          />
        </>
      )}
    </AnimatePresence>
  );
};
