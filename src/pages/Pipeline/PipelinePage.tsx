import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  DndContext, DragOverlay, closestCorners, useDraggable, useDroppable,
  type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { MoreHorizontal, Paperclip, MessageSquare, ChevronDown, SlidersHorizontal, ArrowUpDown, Settings2, ArrowUp, ArrowDown } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { StarRating } from '@/components/ui/StarRating';
import { Button } from '@/components/ui/Button';
import { getStageLabel, getPriorityBadgeClass } from '@/lib/utils';
import type { CandidateStage, Application } from '@/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { jobsApi } from '@/api/jobsApi';
import { applicationsApi } from '@/api/applicationsApi';

const STAGE_COLORS: Record<string, string> = {
  applied: '#64748B',
  screening: '#D97706',
  technical: '#2563EB',
  manager: '#7C3AED',
  hr_round: '#4F46E5',
  offer: '#16A34A',
  hired: '#059669',
  rejected: '#DC2626',
};

function KanbanCard({ app, overlay = false }: { app: Application; overlay?: boolean }) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: app.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !overlay ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => !isDragging && navigate(`/candidates/${app.candidate.id}?applicationId=${app.id}`)}
      className={`bg-white border border-border rounded-[8px] p-3 cursor-grab active:cursor-grabbing hover:shadow-card-hover transition-shadow select-none ${overlay ? 'shadow-modal rotate-1' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Avatar name={`${app.candidate?.firstName || ''} ${app.candidate?.lastName || ''}`.trim() || 'Unknown Candidate'} size="sm" />
          <div className="min-w-0">
            <div className="text-sm font-medium text-text truncate">
              {app.candidate ? `${app.candidate.firstName || ''} ${app.candidate.lastName || ''}`.trim() : 'Unknown Candidate'}
            </div>
            <div className="text-xs text-text-muted truncate">
              {app.candidate?.currentTitle || 'No Title'} · {app.candidate?.currentCompany || 'No Company'}
            </div>
          </div>
        </div>
        {/*
        {app.priority && app.priority !== 'normal' && app.priority !== 'low' && (
          <Badge className={`${getPriorityBadgeClass(app.priority)} text-[9px] px-1.5 py-0.5 flex-shrink-0 ml-1`}>
            {app.priority.toUpperCase()}
          </Badge>
        )}
        */}
      </div>

      <div className="flex items-center justify-between mt-2">
        <StarRating rating={app.matchScore ? Math.round(app.matchScore / 20) : 0} size="sm" />
        <div className="flex items-center gap-1.5 text-text-muted">
          {(app.interviewCount ?? 0) > 0 && <MessageSquare size={11} />}
        </div>
      </div>

      <div className="text-[10px] text-text-muted mt-1.5 font-medium">
        {new Date(app.appliedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, cards }: { stage: {id: string, name: string, stageType: string}; cards: Application[] }) {
  const { setNodeRef } = useDroppable({ id: stage.id });
  const cardIds = cards.map(c => c.id);
  
  const colorKey = stage.stageType.toLowerCase() || 'applied';
  const color = STAGE_COLORS[colorKey] || STAGE_COLORS['applied'];

  return (
    <div className="flex-shrink-0 w-[240px] flex flex-col">
      {/* Column header */}
      <div className="flex items-center gap-2 mb-2 px-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
        <div className="text-xs font-semibold text-text uppercase tracking-wide flex-1">{stage.name}</div>
        <span className="text-xs text-text-muted font-medium bg-gray-100 rounded px-1.5 py-0.5">{cards.length}</span>
        <button className="text-text-muted hover:text-text p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100">
          <MoreHorizontal size={13} />
        </button>
      </div>

      {/* Column body */}
      <div
        ref={setNodeRef}
        className="flex-1 rounded-[8px] bg-gray-50 border border-border/60 p-2 space-y-2 min-h-[200px]"
      >
        <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
          {cards.map(card => (
            <KanbanCard key={card.id} app={card} />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex items-center justify-center h-20 text-xs text-text-muted">
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showJobPicker, setShowJobPicker] = useState(false);
  const [showManageStages, setShowManageStages] = useState(false);
  const [editingStages, setEditingStages] = useState<typeof pipelineStages>([]);

  // 1. Fetch active jobs for the job picker
  const { data: jobsResponse, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['jobs', { status: 'ACTIVE' }],
    queryFn: () => jobsApi.getJobs({ status: 'ACTIVE', size: 100 }),
  });
  const activeJobs = jobsResponse?.data?.content || [];

  // Determine currentJobId from URL or fallback to first job
  const urlJobId = searchParams.get('job');
  const currentJobId = urlJobId || (activeJobs.length > 0 ? activeJobs[0].id : null);
  const selectedJob = activeJobs.find(j => j.id === currentJobId) || activeJobs[0];

  // 2. Fetch applications for the selected job
  const { data: appsResponse, isLoading: isLoadingApps } = useQuery({
    queryKey: ['jobs', currentJobId, 'applications'],
    queryFn: () => applicationsApi.getJobApplications(currentJobId!, { size: 1000 }),
    enabled: !!currentJobId
  });
  
  const applications = appsResponse?.data?.content || []; console.log("APPS RESPONSE:", appsResponse, "APPLICATIONS:", applications);

  // 3. Fetch Pipeline Stages
  const { data: stagesResponse, isLoading: isLoadingStages } = useQuery({
    queryKey: ['jobs', currentJobId, 'stages'],
    queryFn: () => jobsApi.getJobStages(currentJobId!),
    enabled: !!currentJobId
  });
  
  const pipelineStages = stagesResponse?.data || []; console.log("STAGES RESPONSE:", stagesResponse, "PIPELINE STAGES:", pipelineStages);

  const moveStageMutation = useMutation({
    mutationFn: ({ appId, stageId }: { appId: string, stageId: string }) => {
      return applicationsApi.moveApplicationStage(appId, stageId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', currentJobId, 'applications'] });
    }
  });

  const reorderStagesMutation = useMutation({
    mutationFn: (stageIds: string[]) => {
      return jobsApi.updateJobStagesOrder(currentJobId!, stageIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs', currentJobId, 'stages'] });
      setShowManageStages(false);
    }
  });

  // Build cards per stage for this job
  const cardsByStage = useMemo(() => {
    const result: Record<string, Application[]> = {};
    pipelineStages.forEach(s => { result[s.id] = []; });

    applications.forEach(app => {
      const stageId = app.currentStage?.id;
      if (stageId && result[stageId]) {
        result[stageId].push(app);
      } else {
        // Fallback to first stage if exists
        const firstStageId = pipelineStages[0]?.id;
        if (firstStageId && result[firstStageId]) {
          result[firstStageId].push(app);
        }
      }
    });
    return result;
  }, [applications, pipelineStages]);

  const activeCard = useMemo(() => {
    if (!activeId) return null;
    return applications.find(app => app.id === activeId) || null;
  }, [activeId, applications]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const appId = active.id as string;
    const overStageId = over.id as string;
    
    // Check if overStageId is valid
    const targetStage = pipelineStages.find(s => s.id === overStageId);
    if (!targetStage) return;

    const currentStageId = activeCard?.currentStage?.id;
    if (currentStageId !== overStageId) {
      moveStageMutation.mutate({ appId, stageId: overStageId });
      
      // Optimistic update
      queryClient.setQueryData(['jobs', currentJobId, 'applications'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          content: old.content.map((app: Application) => 
            app.id === appId ? { ...app, currentStage: targetStage } : app
          )
        };
      });
    }
  };

  if (isLoadingJobs || isLoadingStages) {
    return <div className="p-8">Loading pipeline...</div>;
  }

  return (
    <div className="max-w-none -mx-6 -mt-6 px-6 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold text-text">Pipeline</h1>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm text-text-muted">Candidate pipeline for</span>
            <div className="relative">
              <button
                onClick={() => setShowJobPicker(v => !v)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary-hover transition-colors"
                disabled={!selectedJob}
              >
                {selectedJob ? selectedJob.title : 'No active jobs'}
                {selectedJob && <ChevronDown size={13} />}
              </button>
              {showJobPicker && (
                <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-border rounded-[8px] shadow-dropdown z-50 py-1">
                  {activeJobs.map(job => (
                    <button
                      key={job.id}
                      onClick={() => {
                        setSearchParams({ job: job.id });
                        setShowJobPicker(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${job.id === currentJobId ? 'text-primary font-medium' : 'text-text'}`}
                    >
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-text-muted">{job.department}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            icon={<Settings2 size={13} />}
            onClick={() => {
              setEditingStages([...pipelineStages]);
              setShowManageStages(true);
            }}
          >
            Manage Stages
          </Button>
          <Button variant="secondary" size="sm" icon={<SlidersHorizontal size={13} />}>Filter</Button>
          <Button variant="secondary" size="sm" icon={<ArrowUpDown size={13} />}>Sort</Button>
        </div>
      </div>

      {/* Kanban board */}
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-x-auto pb-4">
          {!isLoadingJobs && !isLoadingStages && applications.length === 0 ? (
            <div className="py-20 text-center bg-white border border-border rounded-card">
              <div className="text-sm text-text-muted mb-2">No applications found for the selected filters.</div>
              <Button variant="secondary" size="sm" onClick={() => { setSearchParams({ job: currentJobId || '' }); }}>Clear Filters</Button>
            </div>
          ) : (
            <div className="flex gap-3 group" style={{ minWidth: 'max-content' }}>
              {pipelineStages.map(stage => (
                <KanbanColumn key={stage.id} stage={stage} cards={cardsByStage[stage.id] || []} />
              ))}
            </div>
          )}
        </div>

        <DragOverlay>
          {activeCard && <KanbanCard app={activeCard} overlay />}
        </DragOverlay>
      </DndContext>

      <Modal
        open={showManageStages}
        onClose={() => setShowManageStages(false)}
        title="Manage Pipeline Stages"
      >
        <div className="p-5">
          <p className="text-sm text-text-muted mb-4">Reorder the stages for this job's pipeline. Applied and Hired cannot be moved from their respective ends.</p>
          
          <div className="space-y-2 mb-6">
            {editingStages.map((stage, index) => {
              const isFirst = index === 0;
              const isLast = index === editingStages.length - 1;
              const isSystem = stage.stageType === 'APPLIED' || stage.stageType === 'HIRED' || stage.stageType === 'REJECTED';
              
              return (
                <div key={stage.id} className="flex items-center justify-between p-3 bg-white border border-border rounded-md shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ background: STAGE_COLORS[stage.stageType?.toLowerCase()] || '#ccc' }} />
                    <span className="font-medium text-sm text-text">{stage.name}</span>
                    {isSystem && <Badge className="text-[10px] py-0 px-1.5 ml-2">SYSTEM</Badge>}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button
                      className="p-1.5 text-text-muted hover:text-text hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      disabled={isFirst || index === 1 || isSystem}
                      onClick={() => {
                        const newStages = [...editingStages];
                        [newStages[index - 1], newStages[index]] = [newStages[index], newStages[index - 1]];
                        setEditingStages(newStages);
                      }}
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      className="p-1.5 text-text-muted hover:text-text hover:bg-gray-100 rounded disabled:opacity-30 disabled:hover:bg-transparent"
                      disabled={isLast || index === editingStages.length - 2 || isSystem}
                      onClick={() => {
                        const newStages = [...editingStages];
                        [newStages[index], newStages[index + 1]] = [newStages[index + 1], newStages[index]];
                        setEditingStages(newStages);
                      }}
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setShowManageStages(false)}>Cancel</Button>
            <Button 
              onClick={() => reorderStagesMutation.mutate(editingStages.map(s => s.id))}
              loading={reorderStagesMutation.isPending}
            >
              Save Order
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
