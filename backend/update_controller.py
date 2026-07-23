import re
import os

filepath = r"k:\startup\backend\src\main\java\com\startuphub\backend\controller\ChatController.java"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace ChatService injection
content = content.replace("import com.SYNERGI.backend.service.ChatService;", "import com.SYNERGI.backend.service.ChatRoomService;\nimport com.SYNERGI.backend.service.ChatMessageService;")
content = content.replace("private final ChatService chatService;", "private final ChatRoomService chatRoomService;\n    private final ChatMessageService chatMessageService;")

# Map methods to respective services
room_methods = ["getWorkspaceRooms", "getRoomInfo", "getOrCreatePrivateChat", "createGroup", "updateGroup", "updateGroupIcon", "deleteGroup", "addGroupMember", "removeGroupMember", "updateGroupMemberRole", "getRoomMembers"]
msg_methods = ["getRoomMessages", "searchRoomMessages", "sendMessageWithFiles", "getRoomAttachments", "downloadAttachment", "markAsRead", "getRoomReceipts"]

for method in room_methods:
    content = content.replace(f"chatService.{method}", f"chatRoomService.{method}")

for method in msg_methods:
    content = content.replace(f"chatService.{method}", f"chatMessageService.{method}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated ChatController.java")
