CREATE TABLE public.ai_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Conversation',
  archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.ai_conversations TO authenticated;
GRANT ALL ON public.ai_conversations TO service_role;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own conversations read" ON public.ai_conversations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own conversations delete" ON public.ai_conversations FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ai_conversations_user_idx ON public.ai_conversations(user_id, updated_at DESC);

ALTER TABLE public.ai_chat_messages ADD COLUMN conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE CASCADE;
CREATE INDEX ai_chat_messages_conv_idx ON public.ai_chat_messages(conversation_id, created_at);

CREATE TABLE public.ai_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  conversation_id uuid REFERENCES public.ai_conversations(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, DELETE ON public.ai_memories TO authenticated;
GRANT ALL ON public.ai_memories TO service_role;
ALTER TABLE public.ai_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own memories read" ON public.ai_memories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own memories delete" ON public.ai_memories FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ai_memories_user_idx ON public.ai_memories(user_id, created_at DESC);