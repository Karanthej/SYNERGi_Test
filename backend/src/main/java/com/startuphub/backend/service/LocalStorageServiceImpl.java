package com.startuphub.backend.service;

import com.startuphub.backend.exception.BadRequestException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
public class LocalStorageServiceImpl implements StorageService {

    @Value("${app.storage.local.dir:uploads}")
    private String uploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.rootLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create upload directory!", ex);
        }
    }

    @Override
    public String storeFile(UUID startupUuid, UUID attachmentUuid, MultipartFile file) {
        String originalName = StringUtils.cleanPath(file.getOriginalFilename() != null ? file.getOriginalFilename() : "file");
        String extension = "";
        int i = originalName.lastIndexOf('.');
        if (i > 0) {
            extension = originalName.substring(i);
        }

        String newFileName = attachmentUuid.toString() + extension;
        try {
            Path startupDir = this.rootLocation.resolve(startupUuid.toString());
            Files.createDirectories(startupDir);

            Path targetLocation = startupDir.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return newFileName; // We store just the file name/path
        } catch (IOException ex) {
            throw new BadRequestException("Could not store file " + newFileName + ". Please try again!");
        }
    }

    @Override
    public Resource loadFileAsResource(UUID startupUuid, UUID attachmentUuid, String fileExtension) {
        try {
            String fileName = attachmentUuid.toString() + fileExtension;
            Path filePath = this.rootLocation.resolve(startupUuid.toString()).resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new BadRequestException("File not found");
            }
        } catch (MalformedURLException ex) {
            throw new BadRequestException("File not found: " + ex.getMessage());
        }
    }
    
    @Override
    public void deleteFile(UUID startupUuid, UUID attachmentUuid, String fileExtension) {
        try {
            String fileName = attachmentUuid.toString() + fileExtension;
            Path filePath = this.rootLocation.resolve(startupUuid.toString()).resolve(fileName).normalize();
            Files.deleteIfExists(filePath);
        } catch (IOException ex) {
            // Ignore
        }
    }
}
