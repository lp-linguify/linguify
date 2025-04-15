# consumers.py
from channels.generic.websocket import AsyncWebsocketConsumer
from authentication.models import User
import json

class StatusConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            self.user.profile.is_online = True
            await self.user.profile.save()
        await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            self.user.profile.is_online = False
            await self.user.profile.save()


# // React Component
# const UserStatus = ({ isOnline }) => (
#   <span className={`status-icon ${isOnline ? 'online' : 'offline'}`}></span>
# );


# consumers.py
class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if self.user.is_authenticated:
            await self.channel_layer.group_add(f'notifications_{self.user.id}', self.channel_name)
            await self.accept()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(f'notifications_{self.user.id}', self.channel_name)

    async def send_notification(self, event):
        await self.send(text_data=json.dumps(event['notification']))
