import sys, os

sys.path.append(sys.path[0] + "/../player-central/extend")
from extend import Extend

# Get connected to the Extend endpoint.
pc = Extend()

image_list = pc.get_images_list()

# Remove existing images.
if image_list["total"] > 0:
    for image in image_list["data"]:
        print(pc.delete_image(image["id"]))

new_images = [each for each in os.listdir(sys.path[0]) if each.endswith(".png")]

for new_image in new_images:
    fqfn = os.path.join(sys.path[0], new_image)
    print(pc.upload_image(new_image, fqfn))

