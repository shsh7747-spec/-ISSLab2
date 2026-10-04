docker run -it --rm -p 3000:3000 \
--mount type=bind,source="$(pwd)"/code/app.js,target=/home/cs155/proj2/app.js \
--mount type=bind,source="$(pwd)"/code/router.js,target=/home/cs155/proj2/router.js \
--mount type=bind,source="$(pwd)"/code/views,target=/home/cs155/proj2/views \
--name bitbar-container cs155-proj2-image
