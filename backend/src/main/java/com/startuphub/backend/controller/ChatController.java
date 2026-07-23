package com.startuphub.backend.controller;

import com.startuphub.backend.dto.ApiResponse;
import com.startuphub.backend.dto.request.GroupRequest;
import com.startuphub.backend.dto.request.ReadReceiptRequest;
import com.startuphub.backend.dto.response.AttachmentResponse;
import com.startuphub.backend.dto.response.ChatMemberResponse;
import com.startuphub.backend.dto.response.ChatRoomResponse;
import com.startuphub.backend.dto.response.ChatMessageResponse;
import com.startuphub.backend.dto.response.ReadReceiptResponse;
import com.startuphub.backend.service.ChatRoomService;
import com.startuphub.backend.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{startupUuid}/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatRoomService chatRoomService;
    private final ChatMessageService chatMessageService;

    @GetMapping("/rooms")
    public ResponseEntity<ApiResponse<List<ChatRoomResponse>>> getRooms(
            @PathVariable UUID startupUuid, Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.getWorkspaceRooms(authentication.getName(), startupUuid),
                "Rooms retrieved successfully"
        ));
    }

    @GetMapping("/rooms/{roomUuid}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getRoomInfo(
            @PathVariable UUID startupUuid, 
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.getRoomInfo(authentication.getName(), startupUuid, roomUuid),
                "Room info retrieved successfully"
        ));
    }

    @PostMapping("/private/{targetUserUuid}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> getOrCreatePrivateChat(
            @PathVariable UUID startupUuid,
            @PathVariable UUID targetUserUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.getOrCreatePrivateChat(authentication.getName(), startupUuid, targetUserUuid),
                "Private chat retrieved successfully"
        ));
    }

    // --- GROUP CHATS ---

    @PostMapping("/groups")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> createGroup(
            @PathVariable UUID startupUuid,
            @RequestBody GroupRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.createGroup(authentication.getName(), startupUuid, request.getName(), request.getDescription(), request.getMemberUuids()),
                "Group created successfully"
        ));
    }

    @PutMapping("/groups/{roomUuid}")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> updateGroup(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @RequestBody GroupRequest request,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.updateGroup(authentication.getName(), startupUuid, roomUuid, request.getName(), request.getDescription(), request.getIsArchived()),
                "Group updated successfully"
        ));
    }

    @PostMapping(value = "/groups/{roomUuid}/icon", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ChatRoomResponse>> uploadGroupIcon(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @RequestPart("file") MultipartFile file,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.updateGroupIcon(authentication.getName(), startupUuid, roomUuid, file),
                "Group icon updated successfully"
        ));
    }

    @DeleteMapping("/groups/{roomUuid}/icon")
    public ResponseEntity<ApiResponse<ChatRoomResponse>> removeGroupIcon(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.updateGroupIcon(authentication.getName(), startupUuid, roomUuid, null),
                "Group icon removed successfully"
        ));
    }

    @DeleteMapping("/groups/{roomUuid}/messages")
    public ResponseEntity<ApiResponse<Void>> clearChatMessages(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        chatMessageService.clearChatForUser(authentication.getName(), startupUuid, roomUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Chat messages cleared successfully"));
    }

    @DeleteMapping("/groups/{roomUuid}")
    public ResponseEntity<ApiResponse<Void>> deleteGroup(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        chatRoomService.deleteGroup(authentication.getName(), startupUuid, roomUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Group deleted successfully"));
    }

    @PostMapping("/groups/{roomUuid}/members/{targetUserUuid}")
    public ResponseEntity<ApiResponse<Void>> addGroupMember(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @PathVariable UUID targetUserUuid,
            Authentication authentication) {
        chatRoomService.addGroupMember(authentication.getName(), startupUuid, roomUuid, targetUserUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Member added successfully"));
    }

    @DeleteMapping("/groups/{roomUuid}/members/{targetUserUuid}")
    public ResponseEntity<ApiResponse<Void>> removeGroupMember(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @PathVariable UUID targetUserUuid,
            Authentication authentication) {
        chatRoomService.removeGroupMember(authentication.getName(), startupUuid, roomUuid, targetUserUuid);
        return ResponseEntity.ok(ApiResponse.success(null, "Member removed successfully"));
    }

    @PutMapping("/groups/{roomUuid}/members/{targetUserUuid}/role")
    public ResponseEntity<ApiResponse<Void>> updateGroupMemberRole(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @PathVariable UUID targetUserUuid,
            @RequestParam String role,
            Authentication authentication) {
        chatRoomService.updateGroupMemberRole(authentication.getName(), startupUuid, roomUuid, targetUserUuid, role);
        return ResponseEntity.ok(ApiResponse.success(null, "Role updated successfully"));
    }

    // --- ROOM MEMBERS ---
    @GetMapping("/rooms/{roomUuid}/members")
    public ResponseEntity<ApiResponse<List<ChatMemberResponse>>> getRoomMembers(
            @PathVariable UUID startupUuid, 
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatRoomService.getRoomMembers(authentication.getName(), startupUuid, roomUuid),
                "Room members retrieved successfully"
        ));
    }

    @GetMapping("/rooms/{roomUuid}/messages")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> getMessages(
            @PathVariable UUID startupUuid, 
            @PathVariable UUID roomUuid,
            @PageableDefault(size = 50) Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatMessageService.getRoomMessages(authentication.getName(), startupUuid, roomUuid, pageable),
                "Messages retrieved successfully"
        ));
    }

    @GetMapping("/rooms/{roomUuid}/messages/search")
    public ResponseEntity<ApiResponse<Page<ChatMessageResponse>>> searchMessages(
            @PathVariable UUID startupUuid, 
            @PathVariable UUID roomUuid,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String type,
            @PageableDefault(size = 50) Pageable pageable,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatMessageService.searchRoomMessages(authentication.getName(), startupUuid, roomUuid, q, type, pageable),
                "Messages searched successfully"
        ));
    }

    @PutMapping("/rooms/{roomUuid}/messages/{messageUuid}/pin")
    public ResponseEntity<ApiResponse<ChatMessageResponse>> togglePinMessage(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @PathVariable UUID messageUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatMessageService.togglePinMessage(authentication.getName(), startupUuid, roomUuid, messageUuid),
                "Message pinned state toggled successfully"
        ));
    }

    @PostMapping(value = "/rooms/{roomUuid}/messages/with-files", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<ChatMessageResponse>> sendMessageWithFiles(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) String replyToMessageUuid,
            @RequestParam(required = false, defaultValue = "false") Boolean isVoiceNote,
            @RequestParam(required = false) Integer voiceNoteDuration,
            @RequestParam(required = false) String voiceNoteWaveform,
            @RequestPart(value = "files") List<MultipartFile> files,
            Authentication authentication) {
        
        ChatMessageResponse response = chatMessageService.sendMessageWithFiles(
                authentication.getName(), startupUuid, roomUuid, content, replyToMessageUuid, isVoiceNote, voiceNoteDuration, voiceNoteWaveform, files);
                
        return ResponseEntity.ok(ApiResponse.success(response, "Message and files uploaded successfully"));
    }

    @GetMapping("/rooms/{roomUuid}/attachments")
    public ResponseEntity<ApiResponse<List<AttachmentResponse>>> getRoomAttachments(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @RequestParam(required = false) String type, // e.g. "image", "document"
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatMessageService.getRoomAttachments(authentication.getName(), startupUuid, roomUuid, type),
                "Attachments retrieved successfully"
        ));
    }

    @GetMapping("/rooms/{roomUuid}/attachments/{attachmentUuid}")
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @PathVariable UUID attachmentUuid,
            Authentication authentication) {
            
        Resource resource = chatMessageService.downloadAttachment(authentication.getName(), startupUuid, roomUuid, attachmentUuid);
        
        String contentType = "application/octet-stream";
        try {
            String probed = java.nio.file.Files.probeContentType(java.nio.file.Paths.get(resource.getFile().getAbsolutePath()));
            if (probed != null) {
                contentType = probed;
            }
        } catch (java.io.IOException e) {
            // fallback if file can't be resolved properly
            String filename = resource.getFilename();
            if (filename != null) {
                if (filename.toLowerCase().endsWith(".png")) contentType = "image/png";
                else if (filename.toLowerCase().endsWith(".jpg") || filename.toLowerCase().endsWith(".jpeg")) contentType = "image/jpeg";
                else if (filename.toLowerCase().endsWith(".webp")) contentType = "image/webp";
                else if (filename.toLowerCase().endsWith(".pdf")) contentType = "application/pdf";
            }
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }

    // --- READ RECEIPTS ---
    @PostMapping("/rooms/{roomUuid}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            @RequestBody ReadReceiptRequest request,
            Authentication authentication) {
        chatMessageService.markAsRead(authentication.getName(), startupUuid, roomUuid, UUID.fromString(request.getMessageUuid()));
        return ResponseEntity.ok(ApiResponse.success(null, "Message marked as read"));
    }

    @GetMapping("/rooms/{roomUuid}/receipts")
    public ResponseEntity<ApiResponse<List<ReadReceiptResponse>>> getRoomReceipts(
            @PathVariable UUID startupUuid,
            @PathVariable UUID roomUuid,
            Authentication authentication) {
        return ResponseEntity.ok(ApiResponse.success(
                chatMessageService.getRoomReceipts(authentication.getName(), startupUuid, roomUuid),
                "Receipts retrieved successfully"
        ));
    }
}
