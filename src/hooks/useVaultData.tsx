import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export interface VaultFile {
  id: string;
  subject_id: string | null;
  semester_id: string | null;
  file_url: string;
  thumbnail_url: string | null;
  extracted_text: string | null;
  ai_summary: string | null;
  tags: string[];
  ai_detected_subject: string | null;
  ai_confidence: number | null;
  filing_status: string;
  original_filename: string | null;
  file_type: string | null;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  color_key: string;
  teacher_name: string | null;
  icon: string;
  ical_code: string | null;
}

export interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export interface Semester {
  id: string;
  academic_year_id: string | null;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export const useVaultData = () => {
  const { user } = useAuth();
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingFile, setPendingFile] = useState<VaultFile | null>(null);

  // Fetch all vault data
  const fetchData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const [filesRes, subjectsRes, yearsRes, semestersRes] = await Promise.all([
        supabase.from('vault_files').select('*').order('created_at', { ascending: false }),
        supabase.from('subjects').select('*').in('icon', ['COURS', 'SAE']).order('name'),
        supabase.from('academic_years').select('*').order('start_date', { ascending: false }),
        supabase.from('semesters').select('*').order('start_date', { ascending: false }),
      ]);

      if (filesRes.error) throw filesRes.error;
      if (subjectsRes.error) throw subjectsRes.error;
      if (yearsRes.error) throw yearsRes.error;
      if (semestersRes.error) throw semestersRes.error;

      // Re-sign expired URLs
      const rawFiles = (filesRes.data || []) as VaultFile[];
      const refreshedFiles = await Promise.all(
        rawFiles.map(async (file) => {
          try {
            // Extract storage path from signed URL
            const match = file.file_url.match(/\/object\/sign\/([^?]+)/);
            if (!match) return file;
            const storagePath = decodeURIComponent(match[1]);
            const bucketAndPath = storagePath.split('/');
            const bucket = bucketAndPath[0];
            const path = bucketAndPath.slice(1).join('/');
            
            const { data } = await supabase.storage
              .from(bucket)
              .createSignedUrl(path, 60 * 60 * 24); // 24h
            
            if (data?.signedUrl) {
              return { ...file, file_url: data.signedUrl };
            }
            return file;
          } catch {
            return file;
          }
        })
      );

      setFiles(refreshedFiles);
      setSubjects(subjectsRes.data as Subject[] || []);
      setAcademicYears(yearsRes.data || []);
      setSemesters(semestersRes.data || []);
    } catch (error: any) {
      console.error('Error fetching vault data:', error);
      toast.error('Erreur lors du chargement du coffre');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Create a new vault file
  const createFile = async (data: Partial<VaultFile>): Promise<VaultFile | null> => {
    if (!user) return null;

    const insertData = {
      user_id: user.id,
      file_url: data.file_url || '',
      subject_id: data.subject_id || null,
      semester_id: data.semester_id || null,
      thumbnail_url: data.thumbnail_url || null,
      extracted_text: data.extracted_text || null,
      ai_summary: data.ai_summary || null,
      tags: data.tags || [],
      ai_detected_subject: data.ai_detected_subject || null,
      ai_confidence: data.ai_confidence || null,
      filing_status: data.filing_status || 'pending',
      original_filename: data.original_filename || null,
      file_type: data.file_type || null,
    };

    const { data: newFile, error } = await supabase
      .from('vault_files')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Error creating file:', error);
      toast.error('Erreur lors de la création du fichier');
      return null;
    }

    const typedFile = newFile as VaultFile;
    setFiles(prev => [typedFile, ...prev]);
    
    // If pending confirmation, set it
    if (typedFile.filing_status === 'pending') {
      setPendingFile(typedFile);
    }

    return typedFile;
  };

  // Confirm file filing
  const confirmFiling = async (fileId: string, subjectId: string, wasCorrect: boolean): Promise<boolean> => {
    if (!user) return false;

    const file = files.find(f => f.id === fileId);
    if (!file) return false;

    // Update file with confirmed subject
    const { error: updateError } = await supabase
      .from('vault_files')
      .update({ 
        subject_id: subjectId, 
        filing_status: wasCorrect ? 'confirmed' : 'changed' 
      })
      .eq('id', fileId);

    if (updateError) {
      toast.error('Erreur lors de la confirmation');
      return false;
    }

    // Record filing history for learning
    const aiSuggestedSubject = subjects.find(s => s.name === file.ai_detected_subject);
    
    await supabase.from('vault_filing_history').insert({
      user_id: user.id,
      file_id: fileId,
      ai_suggested_subject_id: aiSuggestedSubject?.id || null,
      final_subject_id: subjectId,
      was_correct: wasCorrect,
      context_data: {
        timestamp: new Date().toISOString(),
        ai_confidence: file.ai_confidence,
      }
    });

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, subject_id: subjectId, filing_status: wasCorrect ? 'confirmed' : 'changed' } : f
    ));

    setPendingFile(null);
    toast.success('Fichier classé avec succès');
    return true;
  };

  // Update file
  const updateFile = async (fileId: string, data: Partial<VaultFile>): Promise<boolean> => {
    const { error } = await supabase
      .from('vault_files')
      .update(data)
      .eq('id', fileId);

    if (error) {
      toast.error('Erreur lors de la mise à jour');
      return false;
    }

    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, ...data } : f
    ));
    return true;
  };

  // Delete file
  const deleteFile = async (fileId: string): Promise<boolean> => {
    const { error } = await supabase
      .from('vault_files')
      .delete()
      .eq('id', fileId);

    if (error) {
      toast.error('Erreur lors de la suppression');
      return false;
    }

    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast.success('Fichier supprimé');
    return true;
  };

  // Get files by subject
  const getFilesBySubject = (subjectId: string): VaultFile[] => {
    return files.filter(f => f.subject_id === subjectId);
  };

  // Search across all files using OCR text
  const searchFiles = (query: string): VaultFile[] => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return files.filter(f => 
      f.extracted_text?.toLowerCase().includes(lowerQuery) ||
      f.ai_summary?.toLowerCase().includes(lowerQuery) ||
      f.tags?.some(t => t.toLowerCase().includes(lowerQuery))
    );
  };

  // Get subject stats
  const getSubjectStats = () => {
    return subjects.map(subject => ({
      ...subject,
      fileCount: files.filter(f => f.subject_id === subject.id).length,
      recentFiles: files
        .filter(f => f.subject_id === subject.id)
        .slice(0, 3)
    }));
  };

  // Dismiss pending file notification
  const dismissPending = () => {
    setPendingFile(null);
  };

  return {
    files,
    subjects,
    academicYears,
    semesters,
    loading,
    pendingFile,
    createFile,
    confirmFiling,
    updateFile,
    deleteFile,
    getFilesBySubject,
    searchFiles,
    getSubjectStats,
    dismissPending,
    refetch: fetchData,
  };
};
