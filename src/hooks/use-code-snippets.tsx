import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CodeSnippet {
  id: string;
  user_id: string | null;
  title: string;
  description: string | null;
  code: string;
  language: string;
  is_public: boolean;
  forked_from: string | null;
  fork_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export const useCodeSnippets = (isPublic = true) => {
  return useQuery({
    queryKey: ["code-snippets", isPublic],
    queryFn: async () => {
      let query = supabase
        .from("web3_code_snippets")
        .select("*")
        .order("created_at", { ascending: false });

      if (isPublic) {
        query = query.eq("is_public", true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as CodeSnippet[];
    },
  });
};

export const useMyCodeSnippets = () => {
  return useQuery({
    queryKey: ["my-code-snippets"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("web3_code_snippets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as CodeSnippet[];
    },
  });
};

export const useCodeSnippet = (id: string) => {
  return useQuery({
    queryKey: ["code-snippet", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("web3_code_snippets")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      // Increment view count
      await supabase.rpc("increment_snippet_view_count", { snippet_uuid: id });

      return data as CodeSnippet;
    },
    enabled: !!id,
  });
};

export const useSaveCodeSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snippet: Partial<CodeSnippet>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to save snippets");

      const insertData = {
        title: snippet.title || "",
        description: snippet.description || null,
        code: snippet.code || "",
        language: snippet.language || "solidity",
        is_public: snippet.is_public ?? true,
        forked_from: snippet.forked_from || null,
        user_id: user.id,
      };

      const { data, error } = await supabase
        .from("web3_code_snippets")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data as CodeSnippet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-code-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("Code snippet saved successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to save snippet: ${error.message}`);
    },
  });
};

export const useUpdateCodeSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...snippet }: Partial<CodeSnippet> & { id: string }) => {
      const { data, error } = await supabase
        .from("web3_code_snippets")
        .update(snippet)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as CodeSnippet;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["code-snippet", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["my-code-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("Code snippet updated successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update snippet: ${error.message}`);
    },
  });
};

export const useForkCodeSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (snippet: CodeSnippet) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("You must be logged in to fork snippets");

      // Increment fork count on original
      await supabase.rpc("increment_snippet_fork_count", { snippet_uuid: snippet.id });

      // Create fork
      const { data, error } = await supabase
        .from("web3_code_snippets")
        .insert({
          title: `${snippet.title} (Fork)`,
          description: snippet.description,
          code: snippet.code,
          language: snippet.language,
          is_public: snippet.is_public,
          forked_from: snippet.id,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as CodeSnippet;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-code-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("Code snippet forked successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to fork snippet: ${error.message}`);
    },
  });
};

export const useDeleteCodeSnippet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("web3_code_snippets")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-code-snippets"] });
      queryClient.invalidateQueries({ queryKey: ["code-snippets"] });
      toast.success("Code snippet deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete snippet: ${error.message}`);
    },
  });
};
