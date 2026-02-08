import speech_recognition as sr
import numpy as np
import io
import wave


class SpeechToTextConverter:

    def __init__(self, sample_rate=16000):
        try:
            self.recognizer = sr.Recognizer()
            self.sample_rate = sample_rate
            self.available = True
        except Exception as e:
            self.available = False

    def _numpy_to_wav_bytes(self, audio_np):
        audio_np = np.asarray(audio_np, dtype=np.float32)
        max_val = np.max(np.abs(audio_np))
        if max_val > 0:
            audio_np = audio_np / max_val
        audio_int16 = (audio_np * 32767).astype(np.int16)

        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_int16.tobytes())
        buf.seek(0)
        return buf

    def transcribe(self, audio):
        if not self.available:
            return {'text': '', 'confidence': 0.0, 'error': 'API not available'}

        if audio is None or len(audio) == 0:
            return {'text': '', 'confidence': 0.0, 'error': 'No audio'}

        try:
            wav_buf = self._numpy_to_wav_bytes(audio)

            with sr.AudioFile(wav_buf) as source:
                audio_data = self.recognizer.record(source)

            text = self.recognizer.recognize_google(audio_data)

            return {
                'text': text.strip(),
                'confidence': 0.85,
                'error': None
            }

        except sr.UnknownValueError:
            return {
                'text': '',
                'confidence': 0.0,
                'error': 'Could not understand audio'
            }
        except sr.RequestError as e:
            return {
                'text': '',
                'confidence': 0.0,
                'error': str(e)
            }
        except Exception as e:
            return {
                'text': '',
                'confidence': 0.0,
                'error': str(e)
            }

    def is_available(self):
        return self.available
