import { useState, useEffect } from "react";
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

  // Intercept browser back button when open
  useEffect(() => {
    if (!open) return;
    
    window.history.pushState({ timelineOpen: true }, '', window.location.href);
    
    const handlePopState = (e: PopStateEvent) => {
      // Re-push state to stay on current page, don't close
      window.history.pushState({ timelineOpen: true }, '', window.location.href);
    };
    
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [open]);
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
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[999]"
            onClick={onClose}
          />

          {/* Full screen panel with spring slide */}
          <motion.div
            initial={{ y: '100%', borderRadius: '24px 24px 0 0' }}
            animate={{ y: 0, borderRadius: '0px' }}
            exit={{ y: '100%', borderRadius: '24px 24px 0 0' }}
            transition={{ type: 'spring' as const, damping: 28, stiffness: 280 }}
            data-swipe-blocked
            className="fixed inset-0 bg-background z-[1000] flex flex-col overflow-hidden"
            style={{ overscrollBehavior: 'contain', touchAction: 'pan-y pan-x' }}
            onTouchMove={(e) => e.stopPropagation()}
          >
            {/* Top Bar with staggered children */}
            <motion.div 
              className="flex items-center justify-between px-4 py-3 border-b border-border/15 flex-shrink-0 bg-background/90 backdrop-blur-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.3 }}
            >
              {/* Left: Title */}
              <motion.h2 
                className="font-display font-bold text-base text-foreground"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                Timeline
              </motion.h2>

              {/* Right: Controls + Back button */}
              <div className="flex items-center gap-2">
                {/* View toggle */}
                <div className="flex bg-muted/50 rounded-xl p-0.5 border border-border/15 relative">
                  {(['week', 'day'] as const).map(mode => (
                    <motion.button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      whileTap={{ scale: 0.92 }}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all relative z-10 ${
                        mode === viewMode
                          ? 'text-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {mode === viewMode && (
                        <motion.div
                          layoutId="viewToggle"
                          className="absolute inset-0 bg-card shadow-sm rounded-lg"
                          transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
                        />
                      )}
                      <span className="relative z-10">
                        {mode === 'week' ? 'Semaine' : 'Jour'}
                      </span>
                    </motion.button>
                  ))}
                </div>
                <motion.button 
                  onClick={() => handleAddTask()} 
                  className="p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors"
                  whileTap={{ scale: 0.85, rotate: 90 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Plus className="w-5 h-5 text-primary" />
                </motion.button>
                {/* Back / Close button */}
                <motion.button 
                  onClick={onClose} 
                  className="p-2 rounded-xl hover:bg-muted/50 active:bg-muted transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
                  whileTap={{ scale: 0.85 }}
                  aria-label="Retour"
                >
                  <ArrowLeft className="w-5 h-5 text-foreground" />
                </motion.button>
              </div>
            </motion.div>

            {/* Category Filters with staggered entrance */}
            <motion.div 
              className="flex gap-2 px-4 py-2.5 flex-shrink-0 overflow-x-auto scrollbar-hide"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
            >
              {CATEGORY_FILTERS.map((f, i) => (
                <motion.button
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setCategoryFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all relative ${
                    categoryFilter === f.id
                      ? 'text-primary-foreground shadow-sm'
                      : 'bg-muted/40 text-muted-foreground hover:bg-muted border border-border/15'
                  }`}
                >
                  {categoryFilter === f.id && (
                    <motion.div
                      layoutId="categoryPill"
                      className="absolute inset-0 bg-primary rounded-full"
                      transition={{ type: 'spring' as const, stiffness: 400, damping: 28 }}
                    />
                  )}
                  <span className="relative z-10">{f.label}</span>
                </motion.button>
              ))}
            </motion.div>

            {/* Content with view transition */}
            <div className="flex-1 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={viewMode}
                  initial={{ opacity: 0, x: viewMode === 'week' ? -30 : 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: viewMode === 'week' ? 30 : -30 }}
                  transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                  className="h-full"
                >
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
                </motion.div>
              </AnimatePresence>
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
