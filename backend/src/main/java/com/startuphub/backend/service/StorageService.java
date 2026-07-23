package com.startuphub.backend.service;

import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import java.util.UUID;

public interface StorageService {
    /**
     * Stores a file securely.
     * @param startupUuid the workspace UUID
     * attachmentUuid the generated UUID for the attachment
     * @param file the multipart file to store
     * @return the storage URL/path (could be relative or absolute depending on impl)
     */
    String storeFile(UUID startupUuid, UUID attachmentUuid, MultipartFile file);

    /**
     * Loads a file as a resource.
     * @param startupUuid the workspace UUID
     * @param attachmentUuid the attachment UUID
     * @param fileExtension the original file extension
     * @return the Resource
     */
    Resource loadFileAsResource(UUID startupUuid, UUID attachmentUuid, String fileExtension);
    
    /**
     * Deletes a file.
     */
    void deleteFile(UUID startupUuid, UUID attachmentUuid, String fileExtension);
}
