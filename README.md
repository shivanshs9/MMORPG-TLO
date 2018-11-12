# The Lost Origins
## A sample MMORPG game project

### Contributors
- Shivansh Saini (Backend + Game developer)
- Krishna Teja (Frontend)

### Project Description
This project aims to develop a MMORPG game using RPG Maker MV game engine, which is infamous for supporting only single-player game. For the web server, the infamous Django web framework is used. However, it uses ASGI, instead of WSGI, for providing an Asynchronous server interface which Django painfully lacks.
To support real-time communication between game clients and server, websockets technology is used which is implemented in Django using the Channels library.

### Game Description
Coming soon.

### Tech Stack
- Python
- Javascript
- Django
- RMMV
- Websockets
- Redis
- Channels

### Instructions
To start up server, install all the python requirements (`pip install -r requirements.txt`) and run in shell:
```
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Credits
- KadoKawa for its RMMV game engine (and personally, for all its previous installments).
- [RMN Music Pack](https://rpgmaker.net/musicpack/) for some of its beautiful music tracks.
- [Nelderson's MV Online](https://github.com/Nelderson/MV_Online) project, which helped give really useful insights and its wonderful tutorial series.
