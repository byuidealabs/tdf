sudo apt-get install language-pack-en-base
sudo dpkg-reconfigure locales

apt-get update
apt-get install -y python-software-properties python g++ make git
add-apt-repository ppa:chris-lea/node.js
apt-get update
apt-get install -y nodejs

npm install -g grunt grunt-cli bower

apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | tee /etc/apt/sources.list.d/mongodb.list
apt-get update
apt-get install -y mongodb-10gen

echo 'smallfiles=true' | sudo tee -a /etc/mongodb.conf
sudo service mongodb restart

su vagrant -c "cd ~; git clone http://github.com/byuidealabs/tdf.git"
su vagrant -c "cd ~/tdf; crontab tickercron3000; npm install"

cat >/etc/init/tdf.conf <<EOF
description "Tour De Finance"
author      "IDeA Labs 2013"

start on started mountall
stop on shutdown

respawn
respawn limit 99 5

setuid vagrant

script
    cd /home/vagrant/tdf
    exec /usr/bin/grunt
end script
EOF

start tdf
