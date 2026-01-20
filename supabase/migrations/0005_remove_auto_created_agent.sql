-- Migration: 0005_remove_auto_created_agent.sql
-- Description: Remove the auto-created default agent from migration 0001
-- Reason: AI Agents should only be created by users through the UI
-- Created: 2026-01-19

-- Delete the auto-created agent if it exists and has never been modified
-- We identify it by the exact name and system_prompt from the original migration
DELETE FROM ai_agents
WHERE name = 'Assistente Padrão'
  AND system_prompt = 'Você é um assistente de atendimento ao cliente amigável e prestativo. Responda em português brasileiro de forma clara e concisa. Se não souber a resposta, admita e ofereça alternativas.'
  AND is_default = true;

-- Note: If the user has modified the agent (changed name, prompt, etc), it won't be deleted
-- This ensures we only clean up the untouched auto-created agent
