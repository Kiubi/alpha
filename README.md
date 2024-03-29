# Back-office Kiubi


Créez, modifiez et hébergez votre propre Back-office [Kiubi](https://www.kiubi.com) sous forme d'une application web
qui exploite pleinement l'[API Developers](https://aide.kiubi.com/api-dev-generalites.html).

Vous trouverez une version fonctionnelle à l'adresse : [https://admin.kiubi.com](https://admin.kiubi.com).


## Débuter

L'application compilée est déjà disponible dans le dépôt. Si vous disposez déjà de `npm` et de `php`, vous pouvez
démarrer le serveur web de test et y accéder avec votre navigateur par http://localhost:8000/

	$ npm run start
	
Dans le cas contraire, il faudra trouver une petite place sur un serveur web et consulter la partie "Hébergement" ci
dessous.


## Les mains dans le cambouis

L'application utilise le framework [Marionette JS](https://marionettejs.com/). Pour compiler l'application à partir de
ses sources, il est nécessaire d'installer d'abord ses dépendances :

	$ npm install
	$ npm run build

Un serveur web de test est inclus pour faciliter le développement. Il se lance sur le port local 8000 à l'aide de
la commande :

	$ npm run start


### Fichiers

- Sources : [`src/`](src/)
- Outils de compilation et de developpement : [`bin/`](bin/)
- Webapp compilée pour la production : [`dist/`](dist/)


### Hébergement Apache

Exemple de virtual host (remplacer `[PROJECT]` par le chemin du dépot git) :

	Listen 8080
	<VirtualHost *:8080>
	   DocumentRoot [PROJECT]/dist

	   RewriteEngine On

	   RewriteCond %{REQUEST_FILENAME} !-f
	   RewriteRule .* /index.html
	</VirtualHost>


### Hébergement Nginx

Exemple de virtual host (remplacer `[PROJECT]` par le chemin du dépot git) :

	server {
	    listen 8080;

	    location / {
	        root [PROJECT]/dist;
	        try_files $uri /index.html;
	    }
	}


### Compilation automatique

Le script `watch` permet d'automatiser la compilaton de sources dès qu'un changement est détecté dans le répertoire
`src`. Cela évitera de devoir lancer manuellement un `npm run build` à chacune de vos modifications. Il suffit
d’installer des dépendances complémentaires et de lancer le script qui va tourner en tâche de fond.

	$ npm install -g catw watchify
	$ npm run watch

Et avant de faire un commit, un peu de mise en forme ne ferra pas de mal ;)

	$ npm run js-beautify


## Licence

Ce code source est distributé sous [Licence MIT](http://www.opensource.org/licenses/MIT).