"""Main entry point - FIXED for flat structure"""

from interview_manager import InterviewManager
from scoring_profiles import SCORING_PROFILES


def main():
    """Run interview"""
    
    print("\n" + "="*70)
    print("🎤 INTERVIEW SYSTEM")
    print("="*70 + "\n")
    
    # Get setup
    print("Available profiles:")
    for name, profile in SCORING_PROFILES.items():
        print(f"  • {name:20s} - {profile['description']}")
    
    profile = input("\nChoose profile (default: balanced): ").strip() or "balanced"
    
    if profile not in SCORING_PROFILES:
        print(f"❌ Unknown profile. Using 'balanced'")
        profile = "balanced"
    
    candidate_name = input("Candidate name: ").strip() or "Candidate"
    
    try:
        num_questions = int(input("Number of questions (1-10, default 3): ").strip() or "3")
        if num_questions < 1 or num_questions > 10:
            num_questions = 3
    except:
        num_questions = 3
    
    # Create interview
    interview = InterviewManager(
        model_path="confidence_model.pkl",
        profile=profile
    )
    
    interview.start_interview(candidate_name)
    
    # Get questions
    questions = [
        "Tell me about yourself and your background.",
        "What are your main strengths?",
        "Describe a challenge you solved.",
        "How do you approach learning new things?",
        "What are your career goals?",
        "Tell me about a time you worked in a team.",
        "How do you handle failure or setbacks?",
        "What interests you about this opportunity?",
        "How do you stay organized and manage time?",
        "What questions do you have for us?"
    ]
    
    questions = questions[:num_questions]
    
    print(f"✅ Ready to start with {num_questions} questions")
    input("Press Enter to begin...")
    
    # Ask questions
    for q_num, question in enumerate(questions, 1):
        try:
            interview.ask_question(q_num, question, max_duration=15)
            
            if q_num < len(questions):
                print("\n⏳ Preparing next question...")
                import time
                time.sleep(1)
        
        except KeyboardInterrupt:
            print("\n\n⏹️ Interview interrupted")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")
            import traceback
            traceback.print_exc()
            continue
    
    # Save results
    if interview.answers:
        interview.save_answers(".")
        interview.save_summary(".")
        interview.display_summary()
        print("✅ All files saved!")
    else:
        print("\nNo answers recorded.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
