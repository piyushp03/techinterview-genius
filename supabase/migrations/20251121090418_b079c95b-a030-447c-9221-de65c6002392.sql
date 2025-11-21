-- Add missing columns to interview_sessions table
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS role_type TEXT;

-- Create interview_analysis table for storing analysis results
CREATE TABLE IF NOT EXISTS public.interview_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.interview_sessions(id) ON DELETE CASCADE,
  summary JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(session_id)
);

-- Enable RLS on interview_analysis
ALTER TABLE public.interview_analysis ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for interview_analysis
CREATE POLICY "Users can view analysis for own sessions"
  ON public.interview_analysis
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_analysis.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert analysis for own sessions"
  ON public.interview_analysis
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_analysis.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update analysis for own sessions"
  ON public.interview_analysis
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_analysis.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete analysis for own sessions"
  ON public.interview_analysis
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_analysis.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Add trigger for updated_at on interview_analysis
CREATE TRIGGER update_interview_analysis_updated_at
  BEFORE UPDATE ON public.interview_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_interview_analysis_session_id 
  ON public.interview_analysis(session_id);