// Skill Matching and Recommendation Engine
import type { SkillMatch } from '~/types/connections'

// MatchType from Prisma schema
type MatchType = 'COMPLEMENT' | 'SHARED_INTEREST' | 'MENTOR_MENTEE'

export interface SkillMatchingOptions {
  includeComplementary?: boolean
  includeSharedInterests?: boolean
  includeMentorship?: boolean
  minCompatibilityScore?: number
  maxResults?: number
}

export interface SkillRecommendation {
  targetUser: any
  matchType: MatchType
  compatibilityScore: number
  reason: string
  sharedSkills: string[]
  complementarySkills: string[]
  mutualInterests: string[]
  mentorshipPotential: {
    canMentor: string[]
    canLearnFrom: string[]
  }
  strengthIndicators: {
    skillOverlap: number
    experienceAlignment: number
    goalAlignment: number
    industryFit: number
  }
}

export const useSkillMatching = () => {
  // Skill normalization and taxonomy
  const normalizeSkill = (skill: string): string => {
    const skillMap: Record<string, string> = {
      // Programming languages
      'js': 'JavaScript',
      'javascript': 'JavaScript',
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'react.js': 'React',
      'reactjs': 'React',
      'react': 'React',
      'vue.js': 'Vue',
      'vuejs': 'Vue',
      'vue': 'Vue',
      'node.js': 'Node.js',
      'nodejs': 'Node.js',
      'node': 'Node.js',

      // Frameworks and tools
      'next.js': 'Next.js',
      'nextjs': 'Next.js',
      'nuxt.js': 'Nuxt.js',
      'nuxtjs': 'Nuxt.js',
      'express.js': 'Express',
      'expressjs': 'Express',

      // Databases
      'postgres': 'PostgreSQL',
      'postgresql': 'PostgreSQL',
      'mongo': 'MongoDB',
      'mongodb': 'MongoDB',
      'mysql': 'MySQL',

      // Design
      'ui/ux': 'UI/UX Design',
      'ux': 'UX Design',
      'ui': 'UI Design',
      'figma': 'Figma',
      'sketch': 'Sketch',
      'photoshop': 'Adobe Photoshop',
      'illustrator': 'Adobe Illustrator',

      // Business
      'pm': 'Product Management',
      'product management': 'Product Management',
      'business development': 'Business Development',
      'bd': 'Business Development',
      'marketing': 'Marketing',
      'digital marketing': 'Digital Marketing',
      'seo': 'SEO',

      // Data & AI
      'machine learning': 'Machine Learning',
      'ml': 'Machine Learning',
      'ai': 'Artificial Intelligence',
      'artificial intelligence': 'Artificial Intelligence',
      'data science': 'Data Science',
      'data analysis': 'Data Analysis',
      'analytics': 'Data Analytics'
    }

    const normalized = skill.toLowerCase().trim()
    return skillMap[normalized] || skill.trim()
  }

  // Parse and normalize skills from comma-separated string
  const parseSkills = (skillsString?: string): string[] => {
    if (!skillsString) return []

    return skillsString
      .split(/[,;]/)
      .map(skill => normalizeSkill(skill))
      .filter(skill => skill.length > 0)
      .filter((skill, index, array) => array.indexOf(skill) === index) // Remove duplicates
  }

  // Calculate skill similarity using Jaccard similarity
  const calculateSkillSimilarity = (skills1: string[], skills2: string[]): number => {
    if (skills1.length === 0 && skills2.length === 0) return 0
    if (skills1.length === 0 || skills2.length === 0) return 0

    const set1 = new Set(skills1.map(s => s.toLowerCase()))
    const set2 = new Set(skills2.map(s => s.toLowerCase()))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  // Calculate complementarity score based on skill gaps
  const calculateComplementarity = (userSkills: string[], targetSkills: string[], userLookingFor?: string[]): number => {
    if (!userLookingFor || userLookingFor.length === 0) return 0

    const normalizedLookingFor = userLookingFor.map(s => normalizeSkill(s))
    const normalizedTargetSkills = targetSkills.map(s => s.toLowerCase())

    const complementarySkills = normalizedLookingFor.filter(skill =>
      normalizedTargetSkills.some(targetSkill =>
        targetSkill.includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(targetSkill)
      )
    )

    return complementarySkills.length / normalizedLookingFor.length
  }

  // Calculate text similarity for interests
  const calculateInterestSimilarity = (interests1: string[], interests2: string[]): number => {
    if (interests1.length === 0 && interests2.length === 0) return 0
    if (interests1.length === 0 || interests2.length === 0) return 0

    const set1 = new Set(interests1.map(i => i.toLowerCase().trim()))
    const set2 = new Set(interests2.map(i => i.toLowerCase().trim()))

    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])

    return intersection.size / union.size
  }

  // Determine mentorship potential
  const calculateMentorshipPotential = (user: any, target: any): { canMentor: string[], canLearnFrom: string[] } => {
    const userSkills = parseSkills(user.skills)
    const targetSkills = parseSkills(target.skills)
    const userLookingFor = parseSkills(user.lookingFor)
    const targetLookingFor = parseSkills(target.lookingFor)

    const canMentor = targetLookingFor.filter(skill =>
      userSkills.some(userSkill =>
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    )

    const canLearnFrom = userLookingFor.filter(skill =>
      targetSkills.some(targetSkill =>
        targetSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(targetSkill.toLowerCase())
      )
    )

    return { canMentor, canLearnFrom }
  }

  // Main skill matching algorithm
  const findSkillMatches = async (
    currentUser: any,
    participants: any[],
    eventId: string,
    options: SkillMatchingOptions = {}
  ): Promise<SkillRecommendation[]> => {
    const {
      includeComplementary = true,
      includeSharedInterests = true,
      includeMentorship = true,
      minCompatibilityScore = 0.1,
      maxResults = 10
    } = options

    const userSkills = parseSkills(currentUser.skills)
    const userInterests = parseSkills(currentUser.interests)
    const userLookingFor = parseSkills(currentUser.lookingFor)

    const recommendations: SkillRecommendation[] = []

    for (const participant of participants) {
      if (participant.id === currentUser.id) continue

      const targetSkills = parseSkills(participant.skills)
      const targetInterests = parseSkills(participant.interests)
      const targetLookingFor = parseSkills(participant.lookingFor)

      // Calculate various similarity scores
      const skillSimilarity = calculateSkillSimilarity(userSkills, targetSkills)
      const interestSimilarity = calculateInterestSimilarity(userInterests, targetInterests)
      const complementarity = calculateComplementarity(userSkills, targetSkills, userLookingFor)
      const reverseComplementarity = calculateComplementarity(targetSkills, userSkills, targetLookingFor)

      const mentorshipPotential = calculateMentorshipPotential(currentUser, participant)

      // Determine primary match type and score
      let matchType: MatchType
      let compatibilityScore: number
      let reason: string

      const maxComplementarity = Math.max(complementarity, reverseComplementarity)
      const hasMentorshipPotential = mentorshipPotential.canMentor.length > 0 || mentorshipPotential.canLearnFrom.length > 0

      if (hasMentorshipPotential && includeMentorship && (mentorshipPotential.canMentor.length > 0 || mentorshipPotential.canLearnFrom.length > 0)) {
        matchType = 'MENTOR_MENTEE'
        compatibilityScore = (maxComplementarity * 0.7) + (skillSimilarity * 0.2) + (interestSimilarity * 0.1)

        if (mentorshipPotential.canMentor.length > 0 && mentorshipPotential.canLearnFrom.length > 0) {
          reason = `Mutual mentorship opportunity: You can help with ${mentorshipPotential.canMentor.slice(0, 2).join(', ')} and learn ${mentorshipPotential.canLearnFrom.slice(0, 2).join(', ')}`
        } else if (mentorshipPotential.canMentor.length > 0) {
          reason = `Mentoring opportunity: You can help with ${mentorshipPotential.canMentor.slice(0, 3).join(', ')}`
        } else {
          reason = `Learning opportunity: They can help with ${mentorshipPotential.canLearnFrom.slice(0, 3).join(', ')}`
        }
      } else if (maxComplementarity > skillSimilarity && includeComplementary && maxComplementarity > 0.2) {
        matchType = 'COMPLEMENT'
        compatibilityScore = (maxComplementarity * 0.6) + (skillSimilarity * 0.3) + (interestSimilarity * 0.1)

        if (complementarity > reverseComplementarity) {
          reason = `They have skills you're looking for: ${targetSkills.filter(skill =>
            userLookingFor.some(looking => skill.toLowerCase().includes(looking.toLowerCase()))
          ).slice(0, 3).join(', ')}`
        } else {
          reason = `You have skills they need: ${userSkills.filter(skill =>
            targetLookingFor.some(looking => skill.toLowerCase().includes(looking.toLowerCase()))
          ).slice(0, 3).join(', ')}`
        }
      } else if (includeSharedInterests && (skillSimilarity > 0.1 || interestSimilarity > 0.1)) {
        matchType = 'SHARED_INTEREST'
        compatibilityScore = (skillSimilarity * 0.6) + (interestSimilarity * 0.4)

        const sharedSkills = userSkills.filter(skill =>
          targetSkills.some(tSkill => tSkill.toLowerCase() === skill.toLowerCase())
        )
        const sharedInterests = userInterests.filter(interest =>
          targetInterests.some(tInterest => tInterest.toLowerCase() === interest.toLowerCase())
        )

        if (sharedSkills.length > 0) {
          reason = `Shared expertise in ${sharedSkills.slice(0, 3).join(', ')}`
        } else if (sharedInterests.length > 0) {
          reason = `Common interests: ${sharedInterests.slice(0, 3).join(', ')}`
        } else {
          reason = `Similar background and interests`
        }
      } else {
        continue // Skip if no meaningful match
      }

      if (compatibilityScore < minCompatibilityScore) continue

      // Calculate strength indicators
      const strengthIndicators = {
        skillOverlap: skillSimilarity,
        experienceAlignment: 0.5, // Placeholder - would need experience data
        goalAlignment: interestSimilarity,
        industryFit: 0.5 // Placeholder - would need industry data
      }

      // Find shared and complementary skills
      const sharedSkills = userSkills.filter(skill =>
        targetSkills.some(tSkill => tSkill.toLowerCase() === skill.toLowerCase())
      )

      const complementarySkills = [
        ...targetSkills.filter(skill =>
          userLookingFor.some(looking => skill.toLowerCase().includes(looking.toLowerCase()))
        ),
        ...userSkills.filter(skill =>
          targetLookingFor.some(looking => skill.toLowerCase().includes(looking.toLowerCase()))
        )
      ]

      const mutualInterests = userInterests.filter(interest =>
        targetInterests.some(tInterest => tInterest.toLowerCase() === interest.toLowerCase())
      )

      recommendations.push({
        targetUser: participant,
        matchType,
        compatibilityScore,
        reason,
        sharedSkills,
        complementarySkills,
        mutualInterests,
        mentorshipPotential,
        strengthIndicators
      })
    }

    // Sort by compatibility score and return top results
    return recommendations
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, maxResults)
  }

  // Generate skill-based introductions
  const generateIntroductions = (user: any, recommendations: SkillRecommendation[]): any[] => {
    return recommendations.map(rec => {
      let introMessage = ''

      switch (rec.matchType) {
        case 'MENTOR_MENTEE':
          if (rec.mentorshipPotential.canMentor.length > 0 && rec.mentorshipPotential.canLearnFrom.length > 0) {
            introMessage = `I'd like to introduce you to ${rec.targetUser.name}. You both have complementary skills - you could help each other with ${rec.mentorshipPotential.canMentor[0]} and ${rec.mentorshipPotential.canLearnFrom[0]} respectively.`
          } else if (rec.mentorshipPotential.canMentor.length > 0) {
            introMessage = `Meet ${rec.targetUser.name} - they're looking to learn ${rec.mentorshipPotential.canMentor[0]}, which aligns perfectly with your expertise.`
          } else {
            introMessage = `You should connect with ${rec.targetUser.name} - they have experience in ${rec.mentorshipPotential.canLearnFrom[0]} which you're looking to develop.`
          }
          break

        case 'COMPLEMENT':
          introMessage = `I think you and ${rec.targetUser.name} would make a great team. ${rec.reason.toLowerCase()}.`
          break

        case 'SHARED_INTEREST':
          introMessage = `You and ${rec.targetUser.name} share interests in ${rec.sharedSkills.concat(rec.mutualInterests).slice(0, 2).join(' and ')}. Great opportunity to exchange ideas!`
          break
      }

      return {
        targetPersonId: rec.targetUser.id,
        reason: rec.reason,
        commonInterests: rec.sharedSkills.concat(rec.mutualInterests),
        introMessage,
        matchScore: rec.compatibilityScore
      }
    })
  }

  return {
    normalizeSkill,
    parseSkills,
    calculateSkillSimilarity,
    calculateComplementarity,
    calculateInterestSimilarity,
    findSkillMatches,
    generateIntroductions
  }
}