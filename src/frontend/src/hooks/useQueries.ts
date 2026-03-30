import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalBlob, type FileMetadata, type FolderInput } from "../backend";
import { useActor } from "./useActor";

export function useGetFolderContents(folderId: string | null) {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["folderContents", folderId],
    queryFn: async () => {
      if (!actor) return { files: [], subfolders: [] };
      return actor.getFolderContents(folderId);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetUsedStorage() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["usedStorage"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return actor.getUsedStorage();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerFolders() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerFolders"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCallerFolders();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreateFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FolderInput) => {
      if (!actor) throw new Error("Not connected");
      return actor.createFolder(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      queryClient.invalidateQueries({ queryKey: ["callerFolders"] });
    },
  });
}

export function useDeleteFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (folderId: string) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteFolder(folderId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      queryClient.invalidateQueries({ queryKey: ["callerFolders"] });
    },
  });
}

export function useRenameFolder() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: FolderInput) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateFolder(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      queryClient.invalidateQueries({ queryKey: ["callerFolders"] });
    },
  });
}

export function useSaveFile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      folderId,
    }: { file: File; folderId: string | null }) => {
      if (!actor) throw new Error("Not connected");
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      const fileId = crypto.randomUUID();
      const metadata: FileMetadata = {
        id: fileId,
        blob,
        name: file.name,
        createdAt: BigInt(Date.now()) * BigInt(1_000_000),
        createdBy: { _arr: new Uint8Array(), _isPrincipal: true } as any,
        size: BigInt(file.size),
        mimeType: file.type || "application/octet-stream",
        folderId: folderId ?? undefined,
      };
      return actor.saveFile(fileId, metadata);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folderContents"] });
      queryClient.invalidateQueries({ queryKey: ["usedStorage"] });
    },
  });
}
