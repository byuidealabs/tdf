# Creating a VirtualBox appliance

In order to create a VirtualBox that can be easily used by end-users, you must have both [VirtualBox](http://www.virtualbox.org/) and [Vagrant](http://www.vagrantup.com/) installed.

In this directory, start a vagrant instance:

	vagrant up

Find the name of the running virtualbox VM (It should be deploy_...):

	VBoxManage list runningvms

Halt the VM:

	vagrant halt

Use the name found from the output of the previous command to export that image to OVA format.
If the name of the VM was `deploy_1384991914`, then:

	VBoxManage export deploy_1384991914 -o tour-de-finance.ova --vsys 0 \
		--product "Tour De Finance" --producturl "http://idealabs.byu.edu/" \
		--vendor "Brigham Young University: IDeA Labs"

Distribute `tour-de-finance.ova` to users.

You can also continue to use the vagrant VM how you please, whether for development or testing.
Remember to destroy and re-create the instance if you want to update the OVA file.
