# Microservices Architecture Project

This is a self-inspired project to help me learn the specifics of how microservices are implemented. 

## Basics
### Startup
To start the project, just run ``docker-compose up --build`` and watch the output for the following
* ServiceOne
* ServiceTwo
* Vault

### Watching
These aspects are the bread & butter of this project (consul was used for service discovery and a backend store for vault). As you look for these you should see ServiceOne and ServiceTwo doing the following steps
* Initializing servers for both ServiceOne and ServiceTwo
* Initializing clients for both ServiceOne and ServiceTwo
* Both clients requesting information (``response.message``) from each of the servers
* Both servers logging when it recieves requests from each of the clients
