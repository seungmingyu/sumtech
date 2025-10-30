# pip install transformers torch librosa soundfile

import os
import torch
import librosa
import soundfile as sf
from transformers import AutoModelForAudioClassification, AutoFeatureExtractor

# load model
MODEL_NAME = "mo-thecreator/Deepfake-audio-detection" 


# 오디오 파일이 딥페이크인지 판단하는 함수
#   param: str형의 오디오 경로
#   return: -1: 오류 발생 / 0: 딥페이크가 아님 / 1: 딥페이크 
def IsDeepfakeAudio(audio_path: str):
    
    try:
    # 딥페이크 감지 모델을 로드합니다.
        model = AutoModelForAudioClassification.from_pretrained(MODEL_NAME)
        feature_extractor = AutoFeatureExtractor.from_pretrained(MODEL_NAME)
    except Exception as e:
        return -1

    # -- 1. 오디오 로드 및 리샘플링
    try:
        sampling_rate = feature_extractor.sampling_rate
        audio_data, sr = librosa.load(audio_path, sr=sampling_rate, mono=True)
        
    except Exception as e:
        return -1


    # -- 2. 특징 추출 (전처리)
    # 모델이 입력으로 사용할 수 있는 형태로 오디오 데이터를 변환합니다.
    inputs = feature_extractor(
        audio_data, 
        sampling_rate=sr, 
        return_tensors="pt"
    )


    # -- 3. 모델 예측
    # PyTorch 텐서를 GPU 또는 CPU로 이동
    with torch.no_grad():
        logits = model(**inputs).logits


    # -- 4. 결과 해석
    # 로짓을 확률로 변환 (소프트맥스)
    probabilities = torch.softmax(logits, dim=1)[0]
    id2label = model.config.id2label 
    
    
    # -- 5. 결과 반환
    # 가장 높은 확률을 가진 클래스 선택
    predicted_class_id = torch.argmax(probabilities).item()
    # 최종 예측 결과
    predicted_label = id2label[predicted_class_id]

    if "fake" == predicted_label:
        return 1

    return 0


# --- 실행 ---
if __name__ == "__main__":
    file_path = [
        "app/audio/example3.mp3",
        "app/audio/example4.mp3",
        "app/audio/example5.mp3",
    ]

    for path in file_path:
        if os.path.exists(path):
            print(IsDeepfakeAudio(path))
        else:
            print(f" 오디오 파일을 찾을 수 없습니다. 경로를 확인하세요: {path}")


        