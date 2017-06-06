# Chat module

This is a independent module able to manage a chat Whatsapp-like. It is able to deliver notifications and to keep track of chats between users.

### Components
The module communicates with another module (Login Module - LM), which manages and sync users.
LM is also used to authenticate requests.

### Setup
- Login into Firebase and generate your private key for Admin SDK - NodeJS

### Client communication
#### API
###### Create a chat
POST /chat

Create a new chat, of either single or group. Accepted values are "SINGLE" or "GROUP".
Sender, which is who send request, will be automatically added as admin.

###### Update a chat
PUT /chat/:chatid

Update parametersof chat chatid. With this API you can update name and image of the chat. Both fields are no mandatory.
In order to update users of chat there is another API.

###### Add participants to chat
PUT /chat/:chatid/users/add

Add new members to a chat, with role "USER". If chat is single, only two members can be added. If chat is group then multiple members can be added.
Every members added to a group will receive a notification, except the sender.
If one or more users does not exists, the server ignore them and add others, returning a positive result in any case.

###### Update participant status (admin/user)
PUT /chat/:chatid/users/:userid/role

Update role of the specified user inside specified chat. If admin then turn it to user, if user then turn it to admin.
Changing role can be done if and only if sender is admin, but admin cannot change itself status.
Sender has to be passed inside request body.

###### Post a message
POST /chat/:chatid/message

Send a new message to a specific chat. Send a notification to every chat participants.
A message can have different types (text, audio, system, image, video...)

###### Get chats of an user
GET /chat/all/user/:userid

Get list of chats of an user. This method get all chat information and does not retrieve deleted chats.

###### Get messages in a chat
GET /chat/:chatid/message/all

Get all messages of a chat, since the beginning.

###### Get latest message of a chat
GET /chat/:chatid/lastmessage

Get last message of a chat.

###### Get information and status of a chat
GET /chat/:chatid

Get all information and status of a chat.

###### Get participants of a chat
GET /chat/:chatid/user/all

Get all participants of a chat.

###### Leave chat
PUT /chat/:chatid/users/:userid/remove

Remove an user from a chat.

###### Delete chat
DELETE /chat/:chatid/

Delete a chat, set a flag "deleted" on it. This only removes that chat from chat list of users.

### Login communication
#### API
###### Create a user
POST /users

Create a user every time a new user registers on login module.
If full_name is empty, then the value should contain email address/mandatory_identifier.
Images are stored on external server and img is link to that resource.

###### Update user info
PUT /users/:userid

Update user information. Only name and image can be updated.

###### Update user role inside chat
PUT /chat(:chatid/users/:userid/role

Switch role of an user inside a chat between SINGLE and ADMIN.
If user which request change is admin, then he can edit every other users. Else, he cannot do nothing.
Request is required and is must be set with the sender id.