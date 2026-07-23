package com.startuphub.backend.service.storage;

import com.startuphub.backend.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageService {

    private final Path fileStorageLocation;
    
    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList("image/jpeg", "image/png", "image/jpg");
    private static final List<String> ALLOWED_DOC_TYPES = Arrays.asList("application/pdf");
    private static final long MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final long MAX_DOC_SIZE = 10 * 1024 * 1024; // 10 MB

    public FileStorageService() {
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeImage(MultipartFile file, String subDirectory) {
        validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
        return storeFile(file, subDirectory);
    }

    public String storeDocument(MultipartFile file, String subDirectory) {
        validateFile(file, ALLOWED_DOC_TYPES, MAX_DOC_SIZE);
        return storeFile(file, subDirectory);
    }

    private void validateFile(MultipartFile file, List<String> allowedTypes, long maxSize) {
        if (file.isEmpty()) {
            throw new BadRequestException("Failed to store empty file.");
        }
        if (!allowedTypes.contains(file.getContentType())) {
            throw new BadRequestException("File type not allowed. Allowed types: " + allowedTypes);
        }
        if (file.getSize() > maxSize) {
            throw new BadRequestException("File size exceeds the maximum limit.");
        }
    }

    private String storeFile(MultipartFile file, String subDirectory) {
        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "");
        if(originalFileName.contains("..")) {
            throw new BadRequestException("Sorry! Filename contains invalid path sequence " + originalFileName);
        }
        
        String fileExtension = "";
        int i = originalFileName.lastIndexOf('.');
        if (i > 0) {
            fileExtension = originalFileName.substring(i);
        }
        
        String newFileName = UUID.randomUUID().toString() + fileExtension;
        
        try {
            Path targetLocation = this.fileStorageLocation.resolve(subDirectory);
            Files.createDirectories(targetLocation);
            Path filePath = targetLocation.resolve(newFileName);
            
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            return "/uploads/" + subDirectory + "/" + newFileName;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + newFileName + ". Please try again!", ex);
        }
    }

    public void deleteFile(String fileUrl) {
        if (fileUrl == null || !fileUrl.startsWith("/uploads/")) {
            return;
        }
        
        try {
            // fileUrl is like /uploads/startups/{id}/logo/filename.ext
            // Strip the /uploads/ prefix
            String relativePath = fileUrl.substring("/uploads/".length());
            Path filePath = this.fileStorageLocation.resolve(relativePath).normalize();
            
            // Ensure the path is inside the storage location
            if (!filePath.startsWith(this.fileStorageLocation)) {
                throw new SecurityException("Cannot delete file outside of uploads directory");
            }
            
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            log.error("Could not delete file: {}", fileUrl, ex);
        }
    }
}
