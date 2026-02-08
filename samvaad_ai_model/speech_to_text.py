"""Speech-to-Text using SpeechRecognition library (free, no API key needed)"""

import speech_recognition as sr
import numpy as np
import io
import wave


class SpeechToTextConverter:
    """Convert audio to text using SpeechRecognition (Google free tier)"""
    
    def __init__(self, sample_rate=16000):
        """Initialize speech-to-text"""
        try:
            self.recognizer = sr.Recognizer()
            self.sample_rate = sample_rate
            self.available = True
            print("✅ Speech-to-Text initialized (SpeechRecognition)")
        except Exception as e:
            print(f"⚠️ Speech-to-Text not available: {e}")
            self.available = False
    
    def _numpy_to_wav_bytes(self, audio_np):
        """Convert numpy float32 audio array to WAV bytes"""
        # Normalize and convert to int16
        audio_np = np.asarray(audio_np, dtype=np.float32)
        max_val = np.max(np.abs(audio_np))
        if max_val > 0:
            audio_np = audio_np / max_val
        audio_int16 = (audio_np * 32767).astype(np.int16)
        
        # Write to WAV in memory
        buf = io.BytesIO()
        with wave.open(buf, 'wb') as wf:
            wf.setnchannels(1)
            wf.setsampwidth(2)  # 16-bit
            wf.setframerate(self.sample_rate)
            wf.writeframes(audio_int16.tobytes())
        buf.seek(0)
        return buf
    
    def transcribe(self, audio):
        """
        Transcribe audio to text
        
        Args:
            audio: numpy array of audio at sample_rate
            
        Returns:
            dict with 'text' and 'confidence'
        """
        if not self.available:
            return {'text': '', 'confidence': 0.0, 'error': 'API not available'}
        
        if audio is None or len(audio) == 0:
            return {'text': '', 'confidence': 0.0, 'error': 'No audio'}
        
        try:
            # Convert numpy audio to WAV bytes
            wav_buf = self._numpy_to_wav_bytes(audio)
            
            # Load into SpeechRecognition
            with sr.AudioFile(wav_buf) as source:
                audio_data = self.recognizer.record(source)
            
            # Use Google free speech recognition
            text = self.recognizer.recognize_google(audio_data)
            
            return {
                'text': text.strip(),
                'confidence': 0.85,  # Google free tier doesn't return confidence
                'error': None
            }
        
        except sr.UnknownValueError:
            print("⚠️ Could not understand the audio")
            return {
                'text': '',
                'confidence': 0.0,
                'error': 'Could not understand audio'
            }
        except sr.RequestError as e:
            print(f"❌ Speech recognition service error: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'error': str(e)
            }
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return {
                'text': '',
                'confidence': 0.0,
                'error': str(e)
            }
    
    def is_available(self):
        """Check if API is available"""
        return self.available
