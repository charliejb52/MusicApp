-- Create messages table for direct messaging
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can read their own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON messages;

-- Users can read messages where they are sender or receiver
CREATE POLICY "Users can read their own messages" ON messages
  FOR SELECT USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Users can send messages to other users
CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND auth.uid() != receiver_id
  );

-- Users can update their own messages (for read status, etc.)
CREATE POLICY "Users can update their own messages" ON messages
  FOR UPDATE USING (
    auth.uid() = sender_id OR auth.uid() = receiver_id
  );

-- Create a function to get conversation between two users
CREATE OR REPLACE FUNCTION get_conversation(user1_id UUID, user2_id UUID)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  content TEXT,
  is_read BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  sender_name TEXT,
  receiver_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.is_read,
    m.created_at,
    s.display_name as sender_name,
    r.display_name as receiver_name
  FROM messages m
  JOIN user_profiles s ON m.sender_id = s.id
  JOIN user_profiles r ON m.receiver_id = r.id
  WHERE 
    (m.sender_id = user1_id AND m.receiver_id = user2_id) OR
    (m.sender_id = user2_id AND m.receiver_id = user1_id)
  ORDER BY m.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to get conversations list for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id UUID)
RETURNS TABLE (
  other_user_id UUID,
  other_user_name TEXT,
  other_user_type TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH conversation_partners AS (
    SELECT DISTINCT
      CASE 
        WHEN sender_id = user_id THEN receiver_id
        ELSE sender_id
      END as other_user_id
    FROM messages
    WHERE sender_id = user_id OR receiver_id = user_id
  ),
  last_messages AS (
    SELECT 
      cp.other_user_id,
      m.content as last_message,
      m.created_at as last_message_time,
      m.sender_id,
      m.receiver_id
    FROM conversation_partners cp
    LEFT JOIN LATERAL (
      SELECT content, created_at, sender_id, receiver_id
      FROM messages
      WHERE (sender_id = user_id AND receiver_id = cp.other_user_id) OR
            (sender_id = cp.other_user_id AND receiver_id = user_id)
      ORDER BY created_at DESC
      LIMIT 1
    ) m ON true
  ),
  unread_counts AS (
    SELECT 
      receiver_id as other_user_id,
      COUNT(*) as unread_count
    FROM messages
    WHERE receiver_id = user_id AND is_read = FALSE
    GROUP BY receiver_id
  )
  SELECT 
    lm.other_user_id,
    up.display_name as other_user_name,
    up.user_type as other_user_type,
    lm.last_message,
    lm.last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count
  FROM last_messages lm
  JOIN user_profiles up ON lm.other_user_id = up.id
  LEFT JOIN unread_counts uc ON lm.other_user_id = uc.other_user_id
  ORDER BY lm.last_message_time DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
