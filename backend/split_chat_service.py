import re

with open(r"k:\startup\backend\src\main\java\com\startuphub\backend\service\ChatService.java", "r", encoding="utf-8") as f:
    original = f.read()

# We need to split ChatService into ChatRoomService and ChatMessageService
# Both will extend BaseChatService.

# ChatRoomService methods: getUnreadCount, getWorkspaceRooms, getOrCreatePrivateChat, createGroup, deleteGroup, updateGroup, updateGroupIcon, addGroupMember, removeGroupMember, updateGroupMemberRole, getRoomInfo, getRoomMembers

# ChatMessageService methods: getRoomMessages, searchRoomMessages, sendMessageWithFiles, getRoomAttachments, downloadAttachment, mapMessageToResponse, mapMessageToResponseOptimized, buildMessageResponse, markAsRead, getRoomReceipts

# Let's just create the java files manually because parsing a 800 line Java file via regex is brittle.
# I will output the skeleton of ChatRoomService and ChatMessageService.
