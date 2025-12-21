import numpy as np
import cv2
import base64

def image_to_embedding(image_bytes):
    # Decode image
    npimg = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_GRAYSCALE)

    # Resize & normalize (Mock embedding)
    img = cv2.resize(img, (64, 64))
    embedding = img.flatten() / 255.0

    return embedding.tolist()

def compare_faces(e1, e2):
    e1 = np.array(e1)
    e2 = np.array(e2)
    similarity = np.dot(e1, e2) / (np.linalg.norm(e1) * np.linalg.norm(e2))
    return similarity
