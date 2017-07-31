# Chat module

This is a independent module able to manage a chat Whatsapp-like. It is able to deliver notifications and to keep track of chats between users.

The module communicates with another module (Login Module - LM), which manages and sync users. 
LM is also used to authenticate requests (X-Token should be passed as header for every request).
Configuration can be found inside *helpers/communication.js*.

In the same file there is also a function towards used to manage file uploading. Chat module stores only link to the attachment, not the attachment itself.

## Setup
Login into Firebase and generate your private key for Admin SDK - NodeJS
You need to create a Firebase project and download private key of service account.
Place downloaded file inside *mm.chat/config/serviceAccountKey.json*.

Also, you need to insert the following mandatory rules for database:
```
{
  "rules": {
    ".read": "auth.uid == 'chat-service'",
    ".write": "auth.uid == 'chat-service'",
    "messages": {
      ".indexOn": "chat_id"
    }
  }
}
```
## API
You can find _Insomnia_ environment (ChatModule.json). You can import it and you have requests model ready.
## Client
Every request must be authenticated, through the service implemented inside *helpers/communication.js*. Parameter *X-Token* is mandatory.
#### Create a chat
> POST /chat

Create a new chat, of either single or group. Accepted values are "SINGLE" or "GROUP".
Sender, which is who send request, will be automatically added as admin.

#### Update a chat
> PUT /chat/:chatid

Update parameters of chat with identifier *chatid*. You can update name and image of the chat. Both fields are no mandatory. 

#### Delete chat
> DELETE /chat/:chatid/

Delete a chat, set a flag "deleted" on it. This only removes that chat from chat list of users.

#### Add participants to chat
> PUT /chat/:chatid/users/add

Add new members to a chat, with role "USER". If chat is single, only two members can be added. If chat is group then multiple members can be added.
Every members added to a group will receive a notification, except the sender.
If one or more users does not exists, the server ignore them and add others, returning a positive result in any case.

#### Add participants to chat with a specific role
> PUT /chat/:chatid/users/addrole

Add new members to a chat specifying their user role, which could be ADMIN or USER.

#### Update participant role (admin/user)
> PUT /chat/:chatid/users/:userid/role

Update role of the specified user inside specified chat. If admin then turn it to user, if user then turn it to admin.
Changing role can be done if and only if sender is admin, but admin cannot change itself status.
Switch role of an user inside a chat between SINGLE and ADMIN.

#### Leave a chat
> PUT /chat/:chatid/users/:userid/remove

Remove a user from a chat.

#### Post a message
> POST /chat/:chatid/message

Send a new message to a specific chat. Send a notification to every chat participants, except sender.
A message can have different types (text, audio, image, video) and attachments are managed through a multipart request, which accepts both text and file. However, attachment part is not required.

#### Get chats of an user
> GET /chat/all/user/:userid

Get list of chats of an user. This method get all chat information and does not retrieve deleted chats.

#### Get information and status of a chat
> GET /chat/:chatid

Get all information and status of a chat.

#### Get messages in a chat
> GET /chat/:chatid/message/all

Get all messages of a chat, since the beginning.

#### Get latest message of a chat
> GET /chat/:chatid/lastmessage

Get last message of a chat.

#### Get participants of a chat
> GET /chat/:chatid/user/all

Get all participants of a chat.


## Login
These two requests does not require authentication since they are made on LM, which is considered safe.
#### Create a user
> POST /users

Create a user every time a new user registers on LM.
If full_name is empty, then the value should contain email address/mandatory_identifier.
Images are stored on external server and img is a link to that resource.

#### Update user info
> PUT /users/:userid

Update user information. Only name and image can be updated.