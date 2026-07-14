'use strict'

const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

const config = require('../config')

config.assertSecretsConfigured()

const User = require('../auth/userModel')
const Community = require('../communities/communityModel')
const CommunityMembership = require('../communities/communityMembershipModel')
const CommunityPost = require('../communityPosts/communityPostModel')
const Challenge = require('../challenges/challengeModel')
const ChallengeParticipation = require('../challenges/challengeParticipationModel')
const Habit = require('../habit/habitModel')
const HabitProgress = require('../habit/habitProgressModel')
const Checkin = require('../checkins/checkinModel')
const Institution = require('../institutions/institutionModel')
const Activity = require('../activities/activityModel')
const { getPeriodKey } = require('../habit/periodUtils')
const { syncManagerStripeSubscriptions } = require('./syncManagerStripeSubscriptions')

const PASSWORD = 'Test1234'
const TARGET_DB_NAME = 'PROD_4'

const HABIT_CATEGORIES = ['Nutrition', 'Fitness', 'Learning', 'Wellness', 'Productivity', 'Other']
const HABIT_FREQUENCIES = ['daily', 'weekly']
const HABIT_TYPES = ['build', 'break']

const addDays = (date, days) => {
    const nextDate = new Date(date)
    nextDate.setDate(nextDate.getDate() + days)
    return nextDate
}

const addMinutes = (date, minutes) => {
    const nextDate = new Date(date)
    nextDate.setMinutes(nextDate.getMinutes() + minutes)
    return nextDate
}

const subtractPeriods = (date, frequency, count) =>
    addDays(date, frequency === 'weekly' ? -7 * count : -count)

const periodsBetween = (start, end, frequency) => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffDays = Math.max(0, Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)))
    return frequency === 'weekly'
        ? Math.max(1, Math.floor(diffDays / 7) + 1)
        : Math.max(1, diffDays + 1)
}

const getDbNameFromUri = (uri) => {
    const match = String(uri).match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/)
    return match ? decodeURIComponent(match[1]) : null
}

const assertProd4Target = () => {
    const dbName = getDbNameFromUri(config.MONGODB_URI)
    if (dbName !== TARGET_DB_NAME && process.env.ALLOW_NON_PROD4_SEED !== 'true') {
        throw new Error(`Refusing to seed ${dbName || 'unknown database'}; expected ${TARGET_DB_NAME}.`)
    }
}

const imageForPost = (index) =>
    POST_IMAGE_URLS[index]

const unsplashImage = (id) =>
    `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=80`

const POST_IMAGE_URLS = [
    unsplashImage('1522202176988-66273c2fd55f'),
    unsplashImage('1517048676732-d65bc937f952'),
    unsplashImage('1543269865-cbf427effbad'),
    unsplashImage('1523240795612-9a054b0db644'),
    unsplashImage('1461896836934-ffe607ba8211'),
    unsplashImage('1571019613454-1cb2f99b2d8b'),
    unsplashImage('1547347298-4074fc3086f0'),
    unsplashImage('1500530855697-b586d89ba3ee'),
    unsplashImage('1516321318423-f06f85e504b3'),
    unsplashImage('1506126613408-eca07ce68773'),
    unsplashImage('1529156069898-49953e39b3ac'),
    unsplashImage('1519389950473-47ba0277781c'),
    unsplashImage('1556911220-bff31c812dba'),
    unsplashImage('1498837167922-ddd27525d352'),
    unsplashImage('1543353071-873f17a7a088'),
    unsplashImage('1490818387583-1baba5e638af'),
    unsplashImage('1509042239860-f550ce710b93'),
    unsplashImage('1485965120184-e220f721d03e'),
    unsplashImage('1521737604893-d14cc237f11d'),
    unsplashImage('1530124566582-a618bc2615dc'),
    unsplashImage('1497366754035-f200968a6e72'),
    unsplashImage('1556761175-b413da4baf72'),
    unsplashImage('1500648767791-00dcc994a43e'),
    unsplashImage('1521737711867-e3b97375f902'),
    unsplashImage('1515879218367-8466d910aaa4'),
    unsplashImage('1542744173-8e7e53415bb0'),
    unsplashImage('1504384308090-c894fdcc538d'),
    unsplashImage('1467232004584-a241de8bcf5d'),
    unsplashImage('1511632765486-a01980e01a18'),
    unsplashImage('1529333166437-7750a6dd5a70'),
    unsplashImage('1527529482837-4698179dc6ce'),
    unsplashImage('1529390079861-591de354faf5')
]

const iconUrl = (icon, color) =>
    `https://api.iconify.design/${icon}.svg?color=${encodeURIComponent(color)}`

const categoryIcon = (category) => category.toLowerCase()

const habit = ({ title, frequency, category, habitType, content, kpi, icon }) => ({
    title,
    frequency,
    category,
    habitType,
    content,
    kpi,
    icon: icon || categoryIcon(category)
})

const communitySpecs = [
    {
        name: 'Tum Study Habits',
        description: 'Quiet study blocks, exam planning, and recovery rituals for students moving through heavy coursework.',
        logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ0OljJn6OkEugw0DN5tmugqSUKBZmLwA7C5A957X-Smg&s=10',
        isPrivate: false,
        managerIndex: 0,
        institutionIndex: 0,
        memberTarget: 46,
        challenges: [
            {
                title: '14-Day Focus Sprint',
                description: 'Build a repeatable exam prep rhythm without turning the week into a panic cycle.',
                startsOffset: -6,
                endsOffset: 8,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: '45-Minute Deep Study Block', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Finish one distraction-free block for the hardest current course.', kpi: 'minutes focused' }),
                    habit({ title: 'No Phone During Focus Block', frequency: 'daily', category: 'Productivity', habitType: 'break', content: 'Put the phone away before starting the study timer.', kpi: 'focus blocks protected' }),
                    habit({ title: 'Sunday Exam Plan', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Pick the three most important topics before the week starts.', kpi: 'topics planned' })
                ]
            },
            {
                title: 'Finals Recovery Week',
                description: 'A completed challenge about sleep, food, and decompression after an intense exam period.',
                startsOffset: -34,
                endsOffset: -22,
                status: 'finalized',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'Sleep Before 11:30', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Protect a full sleep window during the last recovery week.', kpi: 'nights on time' }),
                    habit({ title: 'Breakfast Before Review', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Eat something real before opening notes or slides.', kpi: 'breakfasts' }),
                    habit({ title: 'No All-Nighter Week', frequency: 'weekly', category: 'Wellness', habitType: 'break', content: 'Keep the whole week free from overnight study sessions.', kpi: 'weeks protected' })
                ]
            },
            {
                title: 'Presentation Confidence Lab',
                description: 'Practice short presentations, Q&A, and slide clarity before seminar deadlines.',
                startsOffset: -2,
                endsOffset: 19,
                status: 'active',
                difficulty: 'hard',
                habits: [
                    habit({ title: 'Practice One Slide Run-Through', frequency: 'weekly', category: 'Learning', habitType: 'build', content: 'Rehearse a complete slide section with a timer.', kpi: 'run-throughs' }),
                    habit({ title: 'No Avoiding Q&A Prep', frequency: 'daily', category: 'Learning', habitType: 'break', content: 'Write one possible question instead of avoiding the weak spots.', kpi: 'questions prepared' }),
                    habit({ title: 'Send One Progress Update', frequency: 'daily', category: 'Productivity', habitType: 'build', content: 'Share a small update with your project group or supervisor.', kpi: 'updates sent' })
                ]
            }
        ],
        posts: [
            {
                title: 'Library sprint room is booked',
                body: 'We have a quiet room reserved for two focus blocks and a short shared break. Bring one concrete task.',
                imageKeywords: 'university,students,library,study group',
                challengeIndex: 0,
                eventOffset: 1,
                pinned: true
            },
            {
                title: 'Whiteboard recap from yesterday',
                body: 'The hardest statistics questions are now grouped by topic. Add your notes before the next session.',
                imageKeywords: 'students,whiteboard,exam prep,campus',
                challengeIndex: 0,
                eventOffset: -1
            },
            {
                title: 'Presentation practice circle',
                body: 'Three teams are testing their seminar decks this week. Observers are welcome for feedback rounds.',
                imageKeywords: 'university,presentation,students,classroom',
                challengeIndex: 2,
                eventOffset: 4
            },
            {
                title: 'Recovery walk after finals',
                body: 'Photos from the post-exam walk are up. The recovery challenge had our highest completion rate so far.',
                imageKeywords: 'campus,students,walking,university',
                challengeIndex: 1,
                eventOffset: -19
            }
        ]
    },
    {
        name: 'Campus Fitness Collective',
        description: 'Friendly movement challenges for students who want energy, strength, and consistency between classes.',
        logoUrl: iconUrl('lucide:dumbbell', '#047857'),
        isPrivate: false,
        managerIndex: 0,
        institutionIndex: 0,
        memberTarget: 42,
        challenges: [
            {
                title: '8K Steps Between Classes',
                description: 'Turn campus commutes into a shared movement habit.',
                startsOffset: -4,
                endsOffset: 10,
                status: 'active',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'Walk 8,000 Steps', frequency: 'daily', category: 'Fitness', habitType: 'build', content: 'Use class changes, errands, and evening walks to hit the target.', kpi: 'steps' }),
                    habit({ title: 'Skip Short Shuttle Rides', frequency: 'daily', category: 'Fitness', habitType: 'break', content: 'Walk trips that are shorter than two campus stops.', kpi: 'rides skipped' }),
                    habit({ title: 'Invite a Walking Partner', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Make one walk social instead of doing every route alone.', kpi: 'walks shared' })
                ]
            },
            {
                title: 'Strength Basics Month',
                description: 'A low-pressure gym routine for students who want structure without intimidation.',
                startsOffset: -9,
                endsOffset: 21,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Attend One Group Workout', frequency: 'weekly', category: 'Fitness', habitType: 'build', content: 'Join a beginner class or a supervised gym session.', kpi: 'sessions' }),
                    habit({ title: 'Protein With Dinner', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Add a protein source to the main evening meal.', kpi: 'dinners' }),
                    habit({ title: 'No Training on Empty Sleep', frequency: 'daily', category: 'Wellness', habitType: 'break', content: 'Skip intense training when sleep was severely shortened.', kpi: 'unsafe sessions avoided' })
                ]
            },
            {
                title: 'Summer Sports Reset',
                description: 'A finished challenge for outdoor games, mobility, and smart recovery.',
                startsOffset: -48,
                endsOffset: -31,
                status: 'finalized',
                difficulty: 'hard',
                habits: [
                    habit({ title: 'Join an Outdoor Game', frequency: 'daily', category: 'Fitness', habitType: 'build', content: 'Play, run, or practice a sport with others.', kpi: 'active days' }),
                    habit({ title: 'No Sugary Recovery Drink', frequency: 'weekly', category: 'Nutrition', habitType: 'break', content: 'Choose water or a balanced meal after training.', kpi: 'weeks clean' }),
                    habit({ title: 'Plan One Mobility Block', frequency: 'weekly', category: 'Wellness', habitType: 'build', content: 'Reserve time for stretching or foam rolling.', kpi: 'mobility blocks' })
                ]
            }
        ],
        posts: [
            {
                title: 'Meet at the track gate',
                body: 'The step challenge group starts with a casual campus loop before lectures.',
                imageKeywords: 'students,running track,university,sport',
                challengeIndex: 0,
                eventOffset: 2,
                pinned: true
            },
            {
                title: 'Beginner strength station map',
                body: 'We labeled the low-barrier equipment stations so first timers can train without guessing.',
                imageKeywords: 'students,gym,fitness,training',
                challengeIndex: 1,
                eventOffset: 3
            },
            {
                title: 'Post-game stretch circle',
                body: 'A few photos from the outdoor sports reset. Recovery habits made a visible difference.',
                imageKeywords: 'university,students,sports field,team',
                challengeIndex: 2,
                eventOffset: -28
            },
            {
                title: 'Rain route for walkers',
                body: 'If the weather turns, use the covered route between the library, cafeteria, and main hall.',
                imageKeywords: 'campus,students,walking,rain',
                challengeIndex: 0,
                eventOffset: 5
            }
        ]
    },
    {
        name: 'Mind & Sleep Studio',
        description: 'Peer support for better sleep, stress management, and calmer exam seasons.',
        logoUrl: iconUrl('lucide:moon-star', '#7C3AED'),
        isPrivate: true,
        managerIndex: 1,
        institutionIndex: 1,
        memberTarget: 34,
        challenges: [
            {
                title: 'Digital Sunset Challenge',
                description: 'Reduce late-night scrolling and build a realistic evening shutdown routine.',
                startsOffset: -7,
                endsOffset: 7,
                status: 'active',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'No Screens After Midnight', frequency: 'daily', category: 'Wellness', habitType: 'break', content: 'Put the phone away before midnight and keep it outside the bed.', kpi: 'screen-free nights' }),
                    habit({ title: '10-Minute Wind Down', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Do breathing, stretching, or journaling before sleep.', kpi: 'minutes' }),
                    habit({ title: 'Set Weekly Sleep Schedule', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Choose a realistic bedtime target for the week.', kpi: 'schedules set' })
                ]
            },
            {
                title: 'Stress Less Before Exams',
                description: 'A completed exam-season challenge for reducing stress without losing preparation quality.',
                startsOffset: -42,
                endsOffset: -25,
                status: 'finalized',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Two-Minute Breathing Reset', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Use a short reset before opening exam material.', kpi: 'resets' }),
                    habit({ title: 'Review One Hard Topic', frequency: 'weekly', category: 'Learning', habitType: 'build', content: 'Pick one difficult topic and review it with a peer.', kpi: 'topics reviewed' }),
                    habit({ title: 'No Third Coffee After 4pm', frequency: 'daily', category: 'Nutrition', habitType: 'break', content: 'Stop caffeine escalation late in the day.', kpi: 'late coffees skipped' })
                ]
            },
            {
                title: 'Counseling Awareness Week',
                description: 'A future support challenge that normalizes asking for help early.',
                startsOffset: 4,
                endsOffset: 12,
                status: 'draft',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'Share One Campus Support Resource', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Post or send one useful counseling, mentoring, or study support link.', kpi: 'resources shared' }),
                    habit({ title: 'Name One Stress Signal', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Notice and write down one sign that you need a break.', kpi: 'signals noticed' }),
                    habit({ title: 'No Silent Struggle Week', frequency: 'weekly', category: 'Other', habitType: 'break', content: 'Do not keep a serious study or mental health blocker completely private.', kpi: 'weeks supported' })
                ]
            }
        ],
        posts: [
            {
                title: 'Evening phone basket is back',
                body: 'The study lounge has a shared phone basket during the digital sunset check-in.',
                imageKeywords: 'students,wellness,phone,study lounge',
                challengeIndex: 0,
                eventOffset: 1,
                pinned: true
            },
            {
                title: 'Sleep workshop snapshots',
                body: 'Small group notes from the sleep workshop are now in the shared folder.',
                imageKeywords: 'university,students,workshop,wellness',
                challengeIndex: 0,
                eventOffset: -2
            },
            {
                title: 'Breathing reset before mock exam',
                body: 'The exam prep group tried a two-minute reset before starting their mock questions.',
                imageKeywords: 'students,meditation,classroom,exam',
                challengeIndex: 1,
                eventOffset: -27
            },
            {
                title: 'Resource wall draft',
                body: 'Add counseling, mentoring, and academic support contacts before awareness week opens.',
                imageKeywords: 'campus,notice board,students,mental health',
                challengeIndex: 2,
                eventOffset: 5
            }
        ]
    },
    {
        name: 'Student Kitchen & Budget Meals',
        description: 'Cooking, budgeting, meal prep, and campus food choices that actually fit student schedules.',
        logoUrl: iconUrl('lucide:salad', '#B45309'),
        isPrivate: false,
        managerIndex: 1,
        institutionIndex: 1,
        memberTarget: 39,
        challenges: [
            {
                title: 'Affordable Meal Prep',
                description: 'Cook once, eat well, and reduce the expensive last-minute cafeteria scramble.',
                startsOffset: -5,
                endsOffset: 16,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Plan Three Campus Meals', frequency: 'weekly', category: 'Nutrition', habitType: 'build', content: 'Plan three affordable meals before grocery shopping.', kpi: 'meals planned' }),
                    habit({ title: 'Pack a Balanced Lunch', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Bring or assemble one lunch with protein, carbs, and vegetables.', kpi: 'lunches packed' }),
                    habit({ title: 'No Impulse Takeout', frequency: 'daily', category: 'Nutrition', habitType: 'break', content: 'Avoid buying takeout just because no meal was planned.', kpi: 'impulses avoided' })
                ]
            },
            {
                title: 'Plant-Based Campus Week',
                description: 'Try easy plant-forward meals and share realistic student recipes.',
                startsOffset: -1,
                endsOffset: 9,
                status: 'active',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'One Plant-Based Meal', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Eat one plant-forward meal that is filling enough for a class day.', kpi: 'meals' }),
                    habit({ title: 'Cook With a New Classmate', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Make one meal with someone outside your usual group.', kpi: 'shared meals' }),
                    habit({ title: 'No Food Waste Weekend', frequency: 'weekly', category: 'Nutrition', habitType: 'break', content: 'Use leftovers before buying new groceries.', kpi: 'waste-free weekends' })
                ]
            },
            {
                title: 'Exam Snack Reset',
                description: 'A cancelled challenge that still leaves useful examples for better snack routines.',
                startsOffset: -19,
                endsOffset: -10,
                status: 'cancelled',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'No Energy Drinks', frequency: 'daily', category: 'Nutrition', habitType: 'break', content: 'Replace energy drinks with water, tea, or a real snack.', kpi: 'drinks skipped' }),
                    habit({ title: 'Sunday Snack Prep', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Prepare simple study snacks before the week starts.', kpi: 'snacks prepared' }),
                    habit({ title: 'Eat Away From Desk', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Take one proper food break away from the laptop.', kpi: 'breaks' })
                ]
            }
        ],
        posts: [
            {
                title: 'Meal prep table after groceries',
                body: 'Bring containers after the discount grocery run. We will cook lentil bowls and pasta salad.',
                imageKeywords: 'students,cooking,kitchen,meal prep',
                challengeIndex: 0,
                eventOffset: 2,
                pinned: true
            },
            {
                title: 'Budget recipe wall',
                body: 'The most useful recipes now include price estimates and time-to-cook labels.',
                imageKeywords: 'university,students,recipes,food',
                challengeIndex: 0,
                eventOffset: -1
            },
            {
                title: 'Plant-based tasting lunch',
                body: 'The kitchen group is testing three low-cost vegetarian meals on Thursday.',
                imageKeywords: 'students,lunch,vegetarian,campus',
                challengeIndex: 1,
                eventOffset: 3
            },
            {
                title: 'Snack reset lessons',
                body: 'Even though the snack reset was cancelled, the energy drink replacement list is staying up.',
                imageKeywords: 'students,snacks,study,campus',
                challengeIndex: 2,
                eventOffset: -8
            }
        ]
    },
    {
        name: 'Sustainable Campus Crew',
        description: 'Low-waste, climate-aware, and transport-focused habits for everyday university life.',
        logoUrl: iconUrl('lucide:leaf', '#15803D'),
        isPrivate: false,
        managerIndex: 2,
        institutionIndex: 0,
        memberTarget: 44,
        challenges: [
            {
                title: 'Low Waste Lecture Week',
                description: 'Make low-waste choices visible and easy during normal lecture days.',
                startsOffset: -3,
                endsOffset: 6,
                status: 'active',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'No Single-Use Cup', frequency: 'daily', category: 'Other', habitType: 'break', content: 'Bring a bottle or mug for campus drinks.', kpi: 'cups avoided' }),
                    habit({ title: 'Repair or Reuse One Item', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Repair, borrow, or reuse something before buying new.', kpi: 'items saved' }),
                    habit({ title: 'Pack a Reusable Kit', frequency: 'daily', category: 'Productivity', habitType: 'build', content: 'Carry bottle, cutlery, or container before leaving home.', kpi: 'kits packed' })
                ]
            },
            {
                title: 'Bike or Transit Month',
                description: 'Reduce solo car trips while keeping commutes realistic.',
                startsOffset: -11,
                endsOffset: 20,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Active Commute Segment', frequency: 'daily', category: 'Fitness', habitType: 'build', content: 'Bike, walk, or use transit for at least one campus trip.', kpi: 'segments' }),
                    habit({ title: 'No Solo Car Trip Under 3km', frequency: 'daily', category: 'Other', habitType: 'break', content: 'Avoid short solo drives that are easy to replace.', kpi: 'trips avoided' }),
                    habit({ title: 'Check Bike or Transit Plan', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Plan routes before the week gets busy.', kpi: 'plans checked' })
                ]
            },
            {
                title: 'Climate Literacy Sprint',
                description: 'A finished reading challenge for climate basics and local university action.',
                startsOffset: -55,
                endsOffset: -36,
                status: 'finalized',
                difficulty: 'hard',
                habits: [
                    habit({ title: 'Read One Climate Brief', frequency: 'weekly', category: 'Learning', habitType: 'build', content: 'Read one credible climate or sustainability brief.', kpi: 'briefs read' }),
                    habit({ title: 'Explain One Concept', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Summarize one idea in plain language for a classmate.', kpi: 'concepts explained' }),
                    habit({ title: 'No Unread Climate Notes', frequency: 'weekly', category: 'Learning', habitType: 'break', content: 'Do not let saved reading notes pile up untouched.', kpi: 'weeks cleared' })
                ]
            }
        ],
        posts: [
            {
                title: 'Reusable cup photo board',
                body: 'The low-waste board is filling up. Add your setup after the morning lecture.',
                imageKeywords: 'students,reusable cups,sustainability,campus',
                challengeIndex: 0,
                eventOffset: 1,
                pinned: true
            },
            {
                title: 'Bike route test ride',
                body: 'We tested the safest route from the train station to the main building.',
                imageKeywords: 'students,bicycles,campus,sustainability',
                challengeIndex: 1,
                eventOffset: 2
            },
            {
                title: 'Climate reading circle notes',
                body: 'The final climate literacy discussion produced a useful one-page summary.',
                imageKeywords: 'students,climate,discussion,university',
                challengeIndex: 2,
                eventOffset: -34
            },
            {
                title: 'Repair table this Friday',
                body: 'Bring headphones, bags, and small items that can be fixed instead of replaced.',
                imageKeywords: 'students,repair workshop,campus,tools',
                challengeIndex: 0,
                eventOffset: 4
            }
        ]
    },
    {
        name: 'Career Launch Lab',
        description: 'Internship applications, interview practice, portfolios, and professional confidence for students.',
        logoUrl: iconUrl('lucide:briefcase-business', '#0F766E'),
        isPrivate: false,
        managerIndex: 2,
        institutionIndex: 0,
        memberTarget: 40,
        challenges: [
            {
                title: 'Internship Application Sprint',
                description: 'Move from vague intention to submitted applications with steady daily progress.',
                startsOffset: -8,
                endsOffset: 13,
                status: 'active',
                difficulty: 'hard',
                habits: [
                    habit({ title: 'Send One Quality Application', frequency: 'daily', category: 'Productivity', habitType: 'build', content: 'Submit or meaningfully improve one internship application.', kpi: 'applications' }),
                    habit({ title: 'Learn One Company Detail', frequency: 'weekly', category: 'Learning', habitType: 'build', content: 'Research one company beyond the job title.', kpi: 'companies researched' }),
                    habit({ title: 'No Unsent Drafts', frequency: 'daily', category: 'Productivity', habitType: 'break', content: 'Do not leave a ready application sitting unsent.', kpi: 'drafts cleared' })
                ]
            },
            {
                title: 'Interview Practice Circle',
                description: 'Practice technical, behavioral, and confidence-building interview routines together.',
                startsOffset: -2,
                endsOffset: 18,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Mock Interview Round', frequency: 'weekly', category: 'Learning', habitType: 'build', content: 'Practice one interview round with a peer.', kpi: 'rounds' }),
                    habit({ title: 'Two-Minute Confidence Reset', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Use a short reset before interview prep or calls.', kpi: 'resets' }),
                    habit({ title: 'No Solo Prep', frequency: 'daily', category: 'Other', habitType: 'break', content: 'Ask for feedback instead of preparing entirely alone.', kpi: 'solo sessions avoided' })
                ]
            },
            {
                title: 'LinkedIn/Profile Polish',
                description: 'A completed profile improvement challenge with concrete before-and-after progress.',
                startsOffset: -37,
                endsOffset: -19,
                status: 'finalized',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'Update One Profile Section', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Improve one section of LinkedIn, CV, or portfolio.', kpi: 'sections updated' }),
                    habit({ title: 'Read One Alumni Profile', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Study one realistic career path from an alum.', kpi: 'profiles read' }),
                    habit({ title: 'No Generic Outreach', frequency: 'weekly', category: 'Other', habitType: 'break', content: 'Do not send copy-paste networking messages.', kpi: 'weeks personalized' })
                ]
            }
        ],
        posts: [
            {
                title: 'Application sprint leaderboard',
                body: 'The strongest streaks are coming from people who write before lunch.',
                imageKeywords: 'students,laptops,career,applications',
                challengeIndex: 0,
                eventOffset: 1,
                pinned: true
            },
            {
                title: 'Mock interviews in room A2',
                body: 'Bring one role description and one question you are nervous about.',
                imageKeywords: 'students,interview,career,university',
                challengeIndex: 1,
                eventOffset: 3
            },
            {
                title: 'Profile photo corner',
                body: 'The profile polish challenge ended with a small photo and CV review session.',
                imageKeywords: 'students,profile photo,career,campus',
                challengeIndex: 2,
                eventOffset: -17
            },
            {
                title: 'Alumni coffee chat board',
                body: 'Add the roles you want to understand better so we can invite the right alumni.',
                imageKeywords: 'students,coffee chat,career,networking',
                challengeIndex: 0,
                eventOffset: 5
            }
        ]
    },
    {
        name: 'Creative Coding & Maker Nights',
        description: 'Portfolio projects, hackathon habits, prototype demos, and healthier building sessions.',
        logoUrl: iconUrl('lucide:cpu', '#BE123C'),
        isPrivate: false,
        managerIndex: 3,
        institutionIndex: 1,
        memberTarget: 36,
        challenges: [
            {
                title: 'Portfolio Build Nights',
                description: 'Ship small, visible project improvements instead of endlessly planning.',
                startsOffset: -6,
                endsOffset: 17,
                status: 'active',
                difficulty: 'hard',
                habits: [
                    habit({ title: 'Ship One Portfolio Commit', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Merge one visible improvement into a portfolio project.', kpi: 'commits shipped' }),
                    habit({ title: 'Learn One Tooling Trick', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Document one useful framework, design, or debugging trick.', kpi: 'tricks documented' }),
                    habit({ title: 'No Tutorial Copy-Paste', frequency: 'daily', category: 'Other', habitType: 'break', content: 'Explain copied code or rewrite it in your own project context.', kpi: 'shortcuts avoided' })
                ]
            },
            {
                title: 'Hackathon Health Guard',
                description: 'Keep the hackathon fun without destroying sleep, food, or movement.',
                startsOffset: -1,
                endsOffset: 5,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Stand-Up Stretch Break', frequency: 'daily', category: 'Wellness', habitType: 'build', content: 'Take a real body break during long build sessions.', kpi: 'breaks' }),
                    habit({ title: 'Eat a Real Meal', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Eat one proper meal instead of only snacks.', kpi: 'meals' }),
                    habit({ title: 'No Zero-Movement Weekend', frequency: 'weekly', category: 'Fitness', habitType: 'break', content: 'Do not spend the entire weekend seated.', kpi: 'weekends protected' })
                ]
            },
            {
                title: 'Prototype Demo Week',
                description: 'A future demo challenge for testing assumptions before building too much.',
                startsOffset: 8,
                endsOffset: 20,
                status: 'draft',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Demo to One New Person', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Show the prototype to someone outside the team.', kpi: 'demos' }),
                    habit({ title: 'Write Tomorrow Build Plan', frequency: 'daily', category: 'Productivity', habitType: 'build', content: 'Choose the next task before leaving the lab.', kpi: 'plans written' }),
                    habit({ title: 'No Untested Assumption', frequency: 'daily', category: 'Learning', habitType: 'break', content: 'Do not build a major feature without checking the assumption.', kpi: 'assumptions tested' })
                ]
            }
        ],
        posts: [
            {
                title: 'Maker night table layout',
                body: 'Frontend, hardware, and data project tables are labeled for tonight.',
                imageKeywords: 'students,coding,makerspace,laptops',
                challengeIndex: 0,
                eventOffset: 1,
                pinned: true
            },
            {
                title: 'Prototype wall is filling up',
                body: 'Add your screenshots or sketches before the demo week signups open.',
                imageKeywords: 'students,prototype,sticky notes,workshop',
                challengeIndex: 2,
                eventOffset: 7
            },
            {
                title: 'Hackathon snack and stretch corner',
                body: 'We set up water, fruit, and a tiny stretch area next to the project tables.',
                imageKeywords: 'students,hackathon,wellness,coding',
                challengeIndex: 1,
                eventOffset: 2
            },
            {
                title: 'Portfolio screenshots thread',
                body: 'Share a before-and-after screenshot when you ship a weekly portfolio improvement.',
                imageKeywords: 'students,portfolio,web design,laptop',
                challengeIndex: 0,
                eventOffset: 4
            }
        ]
    },
    {
        name: 'Language Exchange & Belonging',
        description: 'Conversation practice, international buddy routines, and inclusive campus events.',
        logoUrl: iconUrl('lucide:languages', '#C2410C'),
        isPrivate: true,
        managerIndex: 4,
        institutionIndex: 1,
        memberTarget: 38,
        challenges: [
            {
                title: 'German Conversation Streak',
                description: 'Build confidence through small daily speaking moments.',
                startsOffset: -3,
                endsOffset: 15,
                status: 'active',
                difficulty: 'easy',
                habits: [
                    habit({ title: 'Speak Five Minutes German', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Use German for a short everyday exchange.', kpi: 'minutes spoken' }),
                    habit({ title: 'Attend Language Table', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Join one campus language table or tandem meetup.', kpi: 'meetups' }),
                    habit({ title: 'No Fear of Mistakes', frequency: 'daily', category: 'Wellness', habitType: 'break', content: 'Do not avoid speaking because the sentence might be imperfect.', kpi: 'avoidance moments beaten' })
                ]
            },
            {
                title: 'International Buddy Month',
                description: 'Help new students build belonging through small repeatable contact.',
                startsOffset: -12,
                endsOffset: 18,
                status: 'active',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Check In With Buddy', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Send or schedule one useful check-in with your buddy.', kpi: 'check-ins' }),
                    habit({ title: 'Plan One Shared Campus Task', frequency: 'daily', category: 'Other', habitType: 'build', content: 'Turn one errand or admin task into a shared plan.', kpi: 'tasks planned' }),
                    habit({ title: 'No One-Person Lunch Week', frequency: 'weekly', category: 'Productivity', habitType: 'break', content: 'Make at least one lunch social this week.', kpi: 'weeks connected' })
                ]
            },
            {
                title: 'Culture Night Prep',
                description: 'A completed event-prep challenge for food, stories, and student performances.',
                startsOffset: -30,
                endsOffset: -14,
                status: 'finalized',
                difficulty: 'medium',
                habits: [
                    habit({ title: 'Prepare One Culture Table Item', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Prepare a dish, poster, playlist, or story for the table.', kpi: 'items prepared' }),
                    habit({ title: 'Learn One Greeting', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Learn a greeting from another student language.', kpi: 'greetings' }),
                    habit({ title: 'No Last-Minute Setup', frequency: 'daily', category: 'Other', habitType: 'break', content: 'Avoid leaving event materials for the final hour.', kpi: 'rushes avoided' })
                ]
            }
        ],
        posts: [
            {
                title: 'Language table moved outside',
                body: 'The German conversation streak meetup will be at the courtyard tables while the weather holds.',
                imageKeywords: 'students,language exchange,courtyard,university',
                challengeIndex: 0,
                eventOffset: 2,
                pinned: true
            },
            {
                title: 'Buddy lunch signup sheet',
                body: 'Add your free lunch slots so new international students can find a buddy this week.',
                imageKeywords: 'students,lunch,international,university',
                challengeIndex: 1,
                eventOffset: 3
            },
            {
                title: 'Culture night photo album',
                body: 'The final photos are attached. Every table had a different story and a packed crowd.',
                imageKeywords: 'students,culture night,international,event',
                challengeIndex: 2,
                eventOffset: -12
            },
            {
                title: 'Tandem cards are printed',
                body: 'Conversation prompt cards are ready for the next exchange round.',
                imageKeywords: 'students,conversation,cards,language',
                challengeIndex: 0,
                eventOffset: 5
            }
        ]
    }
]

const firstNames = [
    'Paul', 'Finn', 'Lena', 'Carla', 'Robin', 'Chris', 'Hanna', 'Nora', 'Jonas', 'Mila',
    'Lea', 'Elias', 'Sofia', 'Felix', 'Mina', 'Noah', 'Amira', 'Luis', 'Clara', 'David',
    'Aylin', 'Ben', 'Maja', 'Oskar', 'Elif', 'Theo', 'Sara', 'Luca', 'Ines', 'Max',
    'Yara', 'Tom', 'Emma', 'Julian', 'Nina', 'Samir', 'Marie', 'Leon', 'Amina', 'Jakob',
    'Greta', 'Tarek', 'Paula', 'Mats', 'Rania', 'Simon', 'Kira', 'Adrian', 'Selin', 'Moritz',
    'Iris', 'Niklas', 'Jana', 'Omar', 'Liv', 'Anton', 'Frida', 'Malik', 'Eva', 'Philipp',
    'Lina', 'Rafael', 'Jule', 'Mika', 'Daria', 'Jan', 'Helena', 'Aron', 'Alina', 'Timo',
    'Nadia', 'Kai', 'Laura', 'Emil', 'Zoe', 'Bastian', 'Miriam', 'Yusuf', 'Svenja', 'Mateo'
]

const lastNames = [
    'Premium', 'Free', 'Streak', 'Consistent', 'Rookie', 'Comeback', 'Hydration', 'Weber', 'Keller', 'Fischer',
    'Schmidt', 'Wagner', 'Hoffmann', 'Becker', 'Schneider', 'Meyer', 'Khan', 'Richter', 'Neumann', 'Wolf',
    'Yilmaz', 'Bauer', 'Klein', 'Zimmer', 'Demir', 'Schulz', 'Rossi', 'Koch', 'Nguyen', 'Hansen',
    'Moreau', 'Aydin', 'Sommer', 'Brandt', 'Lehmann', 'Said', 'Kruger', 'Hartmann', 'Ali', 'Vogel',
    'Fuchs', 'Haddad', 'Kramer', 'Lang', 'Saleh', 'Peters', 'Arslan', 'Kraus', 'Ozdemir', 'Huber',
    'Martin', 'Schwarz', 'Lorenz', 'Benkirane', 'Moller', 'Graf', 'Berger', 'Nassar', 'Dietrich', 'Walter',
    'Engel', 'Santos', 'Frey', 'Horn', 'Petrov', 'Seidel', 'Reuter', 'Farah', 'Kuhn', 'Baum',
    'Ismail', 'Voigt', 'Winter', 'Jensen', 'Novak', 'Stein', 'Ackermann', 'Karim', 'Lindner', 'Costa'
]

const specialStudentAccounts = [
    { username: 'UserPremiumTest', email: 'premium@test.com', subscription: 'premium' },
    { username: 'UserFreeTest', email: 'free@test.com', subscription: 'free' },
    { username: 'UserStreakLeader', email: 'streakleader@test.com', subscription: 'premium' },
    { username: 'UserConsistentTest', email: 'consistent@test.com', subscription: 'free' },
    { username: 'UserRookieTest', email: 'rookie@test.com', subscription: 'free' },
    { username: 'UserComebackTest', email: 'comeback@test.com', subscription: 'premium' },
    { username: 'UserHydrationTest', email: 'hydration@test.com', subscription: 'free' }
]

const managerSpecs = [
    {
        firstName: 'Maria',
        lastName: 'Manager',
        username: 'UserManager',
        email: 'manager@test.com',
        institutionName: 'Technical University of Munich',
        maxCommunities: 4
    },
    {
        firstName: 'Jonas',
        lastName: 'Coordinator',
        username: 'ManagerCampusLife',
        email: 'manager02@test.com',
        institutionName: 'Ludwig Maximilian University of Munich',
        maxCommunities: 4
    },
    {
        firstName: 'Fatima',
        lastName: 'ProgramLead',
        username: 'ManagerSustainability',
        email: 'manager03@test.com',
        institutionName: 'Technical University of Munich',
        maxCommunities: 4
    },
    {
        firstName: 'Tobias',
        lastName: 'MakerLead',
        username: 'ManagerMakerNights',
        email: 'manager04@test.com',
        institutionName: 'Munich University of Applied Sciences',
        maxCommunities: 3
    },
    {
        firstName: 'Elena',
        lastName: 'BelongingLead',
        username: 'ManagerBelonging',
        email: 'manager05@test.com',
        institutionName: 'Munich Student Union',
        maxCommunities: 3
    }
]

const institutionSpecs = [
    {
        name: 'Technical University of Munich',
        emailDomain: 'tum.de',
        logoUrl: iconUrl('lucide:landmark', '#1D4ED8')
    },
    {
        name: 'Ludwig Maximilian University of Munich',
        emailDomain: 'lmu.de',
        logoUrl: iconUrl('lucide:graduation-cap', '#7C3AED')
    }
]

const personalHabitTemplates = [
    habit({ title: 'Morning Campus Walk', frequency: 'daily', category: 'Fitness', habitType: 'build', content: 'Walk outside before the first long screen block.', kpi: 'minutes' }),
    habit({ title: 'Drink Two Bottles of Water', frequency: 'daily', category: 'Nutrition', habitType: 'build', content: 'Finish two reusable bottles before dinner.', kpi: 'bottles' }),
    habit({ title: 'Read Course Notes', frequency: 'daily', category: 'Learning', habitType: 'build', content: 'Review one lecture section before it gets cold.', kpi: 'sections' }),
    habit({ title: 'No Phone in Bed', frequency: 'daily', category: 'Wellness', habitType: 'break', content: 'Charge the phone away from the bed.', kpi: 'nights protected' }),
    habit({ title: 'Weekly Planning Review', frequency: 'weekly', category: 'Productivity', habitType: 'build', content: 'Plan deadlines, workouts, and study blocks for the week.', kpi: 'reviews' }),
    habit({ title: 'Attend One Campus Event', frequency: 'weekly', category: 'Other', habitType: 'build', content: 'Show up to one event outside normal classes.', kpi: 'events' })
]

const validateSpecs = () => {
    if (communitySpecs.length !== 8) {
        throw new Error(`Expected 8 communities, found ${communitySpecs.length}.`)
    }

    const totalPosts = communitySpecs.reduce((sum, community) => sum + community.posts.length, 0)
    if (POST_IMAGE_URLS.length !== totalPosts) {
        throw new Error(`Expected ${totalPosts} post image URLs, found ${POST_IMAGE_URLS.length}.`)
    }

    if (new Set(POST_IMAGE_URLS).size !== POST_IMAGE_URLS.length) {
        throw new Error('Post image URLs must be unique.')
    }

    const combos = new Set()
    communitySpecs.forEach((community, communityIndex) => {
        if (community.challenges.length < 2 || community.challenges.length > 3) {
            throw new Error(`${community.name} must have 2-3 challenges.`)
        }
        if (community.posts.length < 4) {
            throw new Error(`${community.name} must have at least 4 posts.`)
        }
        community.challenges.forEach((challenge) => {
            if (challenge.habits.length < 2 || challenge.habits.length > 3) {
                throw new Error(`${challenge.title} must have 2-3 habits.`)
            }
            challenge.habits.forEach((challengeHabit) => {
                combos.add(`${challengeHabit.category}:${challengeHabit.frequency}:${challengeHabit.habitType}`)
            })
        })
        community.posts.forEach((post) => {
            if (post.challengeIndex !== undefined && !community.challenges[post.challengeIndex]) {
                throw new Error(`Post "${post.title}" references a missing challenge in community ${communityIndex}.`)
            }
        })
    })

    const missingCombos = []
    HABIT_CATEGORIES.forEach((category) => {
        HABIT_FREQUENCIES.forEach((frequency) => {
            HABIT_TYPES.forEach((habitType) => {
                const key = `${category}:${frequency}:${habitType}`
                if (!combos.has(key)) missingCombos.push(key)
            })
        })
    })
    if (missingCombos.length > 0) {
        throw new Error(`Missing habit enum combinations: ${missingCombos.join(', ')}`)
    }
}

const assertUniqueBy = (docs, getKey, label) => {
    const seen = new Set()
    for (const doc of docs) {
        const key = getKey(doc)
        if (seen.has(key)) {
            throw new Error(`Duplicate ${label} seed key: ${key}`)
        }
        seen.add(key)
    }
}

const insertModelInChunks = async (Model, docs, label, chunkSize = 500) => {
    for (let start = 0; start < docs.length; start += chunkSize) {
        const batch = docs.slice(start, start + chunkSize)
        await Model.insertMany(batch, { ordered: false })
        console.log(`Inserted ${Math.min(start + batch.length, docs.length)}/${docs.length} ${label}.`)
    }
}

const insertCollectionInChunks = async (collection, docs, label, chunkSize = 500) => {
    for (let start = 0; start < docs.length; start += chunkSize) {
        const batch = docs.slice(start, start + chunkSize)
        await collection.insertMany(batch, { ordered: false })
        console.log(`Inserted ${Math.min(start + batch.length, docs.length)}/${docs.length} ${label}.`)
    }
}

const buildStudentDocs = (password, seedNow) => {
    return firstNames.map((firstName, index) => {
        const special = specialStudentAccounts[index]
        const subscription = special?.subscription || (index % 4 === 0 || index % 9 === 0 ? 'premium' : 'free')
        const isPremium = subscription === 'premium'
        const number = String(index + 1).padStart(2, '0')
        const age = 19 + (index % 8)

        return {
            firstName,
            lastName: lastNames[index],
            username: special?.username || `Student${number}`,
            email: special?.email || `student${number}@habitum.test`,
            password,
            birthday: new Date(seedNow.getFullYear() - age, index % 12, 4 + (index % 24)),
            billingInfo: isPremium ? `Student premium plan ${number}` : undefined,
            subscription,
            accountType: 'user',
            stripeCustomerId: isPremium ? `cus_mock_student_${number}` : undefined,
            stripeSubscriptionId: isPremium ? `sub_mock_student_${number}` : undefined,
            stripeSubscriptionStatus: isPremium ? 'active' : undefined,
            subscriptionCurrentPeriodEnd: isPremium ? addDays(seedNow, 24 + (index % 17)) : undefined,
            subscriptionCancelAtPeriodEnd: isPremium && index % 13 === 0
        }
    })
}

const buildManagerDocs = (password, seedNow) =>
    managerSpecs.map((manager, index) => ({
        ...manager,
        password,
        accountType: 'manager',
        subscription: 'manager',
        billingInfo: `Manager subscription for ${manager.institutionName}`,
        stripeCustomerId: `cus_mock_manager_${index + 1}`,
        stripeSubscriptionId: `sub_mock_manager_${index + 1}`,
        stripeSubscriptionStatus: 'active',
        subscriptionCurrentPeriodEnd: addDays(seedNow, 30 + index * 3),
        subscriptionCancelAtPeriodEnd: false
    }))

const selectRotating = (items, start, count) => {
    const selected = []
    const seen = new Set()
    let offset = 0
    while (selected.length < Math.min(count, items.length)) {
        const itemIndex = (start + offset) % items.length
        const item = items[itemIndex]
        const key = item._id ? item._id.toString() : String(itemIndex)
        if (!seen.has(key)) {
            selected.push(item)
            seen.add(key)
        }
        offset += 1
    }
    return selected
}

const setNaturalTime = (date, seed, seedNow) => {
    const nextDate = new Date(date)
    nextDate.setHours(7 + (seed % 13), (seed * 11) % 60, (seed * 17) % 60, 0)
    if (nextDate > seedNow) {
        return addMinutes(seedNow, -1 * (5 + (seed % 180)))
    }
    return nextDate
}

const buildRunDates = ({ frequency, length, endDate, seed, seedNow }) => {
    const dates = []
    for (let index = length - 1; index >= 0; index -= 1) {
        dates.push(setNaturalTime(subtractPeriods(endDate, frequency, index), seed + index, seedNow))
    }
    return dates
}

const queueProgress = ({
    user,
    habitDoc,
    currentStreak,
    bestStreak,
    endDate,
    seed,
    seedNow,
    checkinDocs,
    progressDocs,
    activitySources,
    activityContext = null,
    forceStale = false
}) => {
    const effectiveBest = Math.max(bestStreak, currentStreak)
    const dates = []

    if (currentStreak > 0) {
        if (effectiveBest > currentStreak) {
            const olderEndDate = subtractPeriods(endDate, habitDoc.frequency, currentStreak + 2)
            dates.push(...buildRunDates({
                frequency: habitDoc.frequency,
                length: effectiveBest,
                endDate: olderEndDate,
                seed: seed + 31,
                seedNow
            }))
        }
        dates.push(...buildRunDates({
            frequency: habitDoc.frequency,
            length: currentStreak,
            endDate,
            seed,
            seedNow
        }))
    } else if (effectiveBest > 0) {
        const staleEndDate = subtractPeriods(endDate, habitDoc.frequency, forceStale ? 2 : 1)
        dates.push(...buildRunDates({
            frequency: habitDoc.frequency,
            length: effectiveBest,
            endDate: staleEndDate,
            seed,
            seedNow
        }))
    }

    if (dates.length === 0) return

    dates.sort((left, right) => left - right)
    const createdCheckins = dates.map((date) => ({
        _id: new mongoose.Types.ObjectId(),
        user: user._id,
        habit: habitDoc._id,
        date,
        periodKey: getPeriodKey(date, habitDoc.frequency),
        isPrivate: false,
        createdAt: date,
        updatedAt: date
    }))

    checkinDocs.push(...createdCheckins)

    const lastCheckin = createdCheckins[createdCheckins.length - 1]
    progressDocs.push({
        user: user._id,
        habit: habitDoc._id,
        currentStreak,
        bestStreak: effectiveBest,
        lastCheckinAt: lastCheckin.date,
        lastPeriodKey: lastCheckin.periodKey,
        totalCheckins: createdCheckins.length
    })

    if (activityContext) {
        const feedWindowStart = addDays(seedNow, -4)
        createdCheckins
            .filter((checkin) => checkin.date >= feedWindowStart)
            .forEach((checkin, index) => {
                activitySources.push({
                    user,
                    habitDoc,
                    checkin,
                    streak: Math.max(1, currentStreak - (createdCheckins.length - index - 1)),
                    ...activityContext
                })
            })
    }
}

const seed = async () => {
    validateSpecs()
    assertProd4Target()

    const seedNow = new Date()
    const password = await bcrypt.hash(PASSWORD, 10)

    console.log(`Connecting to ${TARGET_DB_NAME}...`)
    await mongoose.connect(config.MONGODB_URI, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
        socketTimeoutMS: 120000
    })
    console.log(`Connected to ${TARGET_DB_NAME}. Rebuilding mock data...`)

    await Promise.all([
        Activity.deleteMany({}),
        Checkin.deleteMany({}),
        HabitProgress.deleteMany({}),
        ChallengeParticipation.deleteMany({}),
        Habit.deleteMany({}),
        Challenge.deleteMany({}),
        CommunityPost.deleteMany({}),
        CommunityMembership.deleteMany({}),
        Community.deleteMany({}),
        Institution.deleteMany({}),
        User.deleteMany({})
    ])
    console.log('Cleared existing PROD_4 collections.')

    const institutions = await Institution.create(institutionSpecs)
    const students = await User.create(buildStudentDocs(password, seedNow))
    const managers = await User.create(buildManagerDocs(password, seedNow))
    const premiumStudentCount = students.filter((user) => user.subscription === 'premium').length
    console.log(`Created ${students.length} students and ${managers.length} managers.`)

    const communities = await Community.create(communitySpecs.map((community, index) => ({
        name: community.name,
        description: community.description,
        logoUrl: community.logoUrl,
        isPrivate: community.isPrivate,
        institution: institutions[community.institutionIndex]._id,
        createdBy: managers[community.managerIndex]._id,
        createdAt: addDays(seedNow, -65 + index * 3),
        updatedAt: addDays(seedNow, -5 + index)
    })))

    const acceptedMembersByCommunity = new Map()
    const membershipDocs = []

    communitySpecs.forEach((community, communityIndex) => {
        const communityDoc = communities[communityIndex]
        const owner = managers[community.managerIndex]
        const coManager = managers[(community.managerIndex + 1) % managers.length]
        const studentMembers = selectRotating(students, communityIndex * 9, community.memberTarget)
        const premiumAdmins = studentMembers.filter((student) => student.subscription === 'premium').slice(0, 2)
        const memberRoles = new Map()

        const addMembership = (user, role, joinedAt) => {
            const userId = user._id.toString()
            if (memberRoles.has(userId)) return
            memberRoles.set(userId, role)
            membershipDocs.push({
                user: user._id,
                community: communityDoc._id,
                role,
                membershipStatus: 'accepted',
                joinedAt,
                createdAt: joinedAt,
                updatedAt: joinedAt
            })
        }

        addMembership(owner, 'creator', addDays(seedNow, -70 + communityIndex))
        addMembership(coManager, 'admin', addDays(seedNow, -55 + communityIndex))
        premiumAdmins.forEach((student, adminIndex) => {
            addMembership(student, 'admin', addDays(seedNow, -48 + communityIndex + adminIndex))
        })
        studentMembers.forEach((student, studentIndex) => {
            addMembership(student, 'member', addDays(seedNow, -45 + ((studentIndex * 3 + communityIndex) % 42)))
        })

        acceptedMembersByCommunity.set(
            communityDoc._id.toString(),
            Array.from(memberRoles.keys()).map((id) => new mongoose.Types.ObjectId(id))
        )
    })

    await CommunityMembership.create(membershipDocs)
    console.log(`Created ${communities.length} communities and ${membershipDocs.length} memberships.`)

    const challengeDocs = []
    const challengeMeta = []
    communitySpecs.forEach((community, communityIndex) => {
        community.challenges.forEach((challenge, challengeIndex) => {
            challengeDocs.push({
                community: communities[communityIndex]._id,
                title: challenge.title,
                description: challenge.description,
                starts: addDays(seedNow, challenge.startsOffset),
                ends: addDays(seedNow, challenge.endsOffset),
                status: challenge.status,
                difficulty: challenge.difficulty,
                createdBy: managers[community.managerIndex]._id,
                createdAt: addDays(seedNow, challenge.startsOffset - 5),
                updatedAt: addDays(seedNow, Math.min(challenge.endsOffset, -1))
            })
            challengeMeta.push({ communityIndex, challengeIndex, challenge })
        })
    })

    const challenges = await Challenge.create(challengeDocs)
    console.log(`Created ${challenges.length} challenges.`)

    const userById = new Map([...students, ...managers].map((user) => [user._id.toString(), user]))
    const challengeHabitDocs = []
    const challengeHabitMeta = []

    challengeMeta.forEach((meta, flatChallengeIndex) => {
        meta.challenge.habits.forEach((challengeHabit, habitIndex) => {
            challengeHabitDocs.push({
                title: challengeHabit.title,
                frequency: challengeHabit.frequency,
                content: challengeHabit.content,
                kpi: challengeHabit.kpi,
                category: challengeHabit.category,
                habitType: challengeHabit.habitType,
                icon: challengeHabit.icon,
                kind: 'challenge',
                challenge: challenges[flatChallengeIndex]._id,
                createdAt: addDays(seedNow, meta.challenge.startsOffset - 2 + habitIndex),
                updatedAt: addDays(seedNow, -1)
            })
            challengeHabitMeta.push({ ...meta, flatChallengeIndex, habitIndex })
        })
    })

    const challengeHabits = await Habit.create(challengeHabitDocs)
    console.log(`Created ${challengeHabits.length} challenge habits.`)
    const habitsByChallenge = new Map()
    challengeHabits.forEach((challengeHabitDoc, index) => {
        const challengeId = challenges[challengeHabitMeta[index].flatChallengeIndex]._id.toString()
        if (!habitsByChallenge.has(challengeId)) habitsByChallenge.set(challengeId, [])
        habitsByChallenge.get(challengeId).push(challengeHabitDoc)
    })

    const participationDocs = []
    const participationRuntime = []

    challenges.forEach((challengeDoc, flatChallengeIndex) => {
        const meta = challengeMeta[flatChallengeIndex]
        const communityDoc = communities[meta.communityIndex]
        const memberIds = acceptedMembersByCommunity.get(communityDoc._id.toString())
        const status = meta.challenge.status
        const baseTarget = status === 'draft'
            ? 12
            : status === 'cancelled'
                ? 18
                : status === 'finalized'
                    ? 30
                    : 24 + ((meta.communityIndex + meta.challengeIndex) % 7)
        const selectedMemberIds = selectRotating(memberIds, meta.communityIndex * 11 + meta.challengeIndex * 5, baseTarget)

        selectedMemberIds.forEach((userId, participantIndex) => {
            let participationStatus = 'joined'
            let completedAt = null
            let leftAt = null

            if (status === 'finalized') {
                if (participantIndex % 10 < 6) {
                    participationStatus = 'completed'
                    completedAt = addDays(seedNow, meta.challenge.endsOffset)
                } else if (participantIndex % 10 < 8) {
                    participationStatus = 'left'
                    leftAt = addDays(seedNow, meta.challenge.endsOffset - 4)
                }
            } else if (status === 'cancelled') {
                participationStatus = participantIndex % 4 === 0 ? 'joined' : 'left'
                leftAt = participationStatus === 'left' ? addDays(seedNow, meta.challenge.endsOffset) : null
            } else if (status === 'draft') {
                participationStatus = 'joined'
            } else if (participantIndex % 17 === 0) {
                participationStatus = 'left'
                leftAt = addDays(seedNow, -1)
            }

            const joinedAt = addDays(seedNow, Math.min(meta.challenge.startsOffset - 2 + (participantIndex % 5), -1))
            participationDocs.push({
                user: userId,
                challenge: challengeDoc._id,
                participationStatus,
                joinedAt,
                completedAt,
                leftAt,
                createdAt: joinedAt,
                updatedAt: completedAt || leftAt || joinedAt
            })
            participationRuntime.push({
                user: userById.get(userId.toString()),
                challengeDoc,
                meta,
                participationStatus,
                participantIndex
            })
        })
    })

    await ChallengeParticipation.create(participationDocs)
    console.log(`Created ${participationDocs.length} challenge participations.`)

    const checkinDocs = []
    const progressDocs = []
    const activitySources = []

    console.log(`Generating challenge histories for ${participationRuntime.length} participations...`)
    participationRuntime.forEach((participation, runtimeIndex) => {
        if (runtimeIndex > 0 && runtimeIndex % 100 === 0) {
            console.log(`Generated histories for ${runtimeIndex}/${participationRuntime.length} participations.`)
        }
        const challengeDoc = participation.challengeDoc
        const meta = participation.meta
        const challengeHabitList = habitsByChallenge.get(challengeDoc._id.toString()) || []

        if (meta.challenge.status === 'draft') return

        const progressEndDate = meta.challenge.status === 'active'
            ? seedNow
            : addDays(seedNow, Math.min(meta.challenge.endsOffset, -3))
        const availableContext = {
            community: communities[meta.communityIndex],
            challenge: challengeDoc
        }

        challengeHabitList.forEach((challengeHabitDoc, habitIndex) => {
            if (participation.participationStatus === 'left' && habitIndex > 0) return

            const maxPossible = periodsBetween(challengeDoc.starts, progressEndDate, challengeHabitDoc.frequency)
            const activeCap = challengeHabitDoc.frequency === 'weekly' ? 5 : 9
            const rawStreak = 1 + ((runtimeIndex + habitIndex * 3) % activeCap)
            let currentStreak = Math.min(rawStreak, maxPossible)
            let bestStreak = currentStreak + ((runtimeIndex + habitIndex) % 3)

            if (participation.participationStatus === 'completed') {
                currentStreak = Math.min(Math.max(currentStreak, 3), maxPossible)
                bestStreak = Math.max(bestStreak, currentStreak + 1)
            }

            if (participation.participationStatus === 'left') {
                currentStreak = 0
                bestStreak = Math.min(1 + (runtimeIndex % 4), maxPossible)
            }

            if (meta.challenge.status === 'cancelled' && participation.participationStatus === 'joined') {
                currentStreak = 0
                bestStreak = Math.min(2 + (runtimeIndex % 3), maxPossible)
            }

            queueProgress({
                user: participation.user,
                habitDoc: challengeHabitDoc,
                currentStreak,
                bestStreak,
                endDate: progressEndDate,
                seed: runtimeIndex * 7 + habitIndex,
                seedNow,
                checkinDocs,
                progressDocs,
                activitySources,
                activityContext: meta.challenge.status === 'active' && participation.participationStatus === 'joined'
                    ? availableContext
                    : null,
                forceStale: participation.participationStatus === 'left'
            })
        })
    })
    console.log(`Generated histories for ${participationRuntime.length}/${participationRuntime.length} participations.`)

    const personalHabitDocs = []
    const personalHabitOwners = []
    students.slice(0, 16).forEach((student, studentIndex) => {
        const templates = selectRotating(personalHabitTemplates, studentIndex % personalHabitTemplates.length, 4)
        templates.forEach((template, templateIndex) => {
            personalHabitDocs.push({
                ...template,
                kind: 'personal',
                user: student._id,
                createdAt: addDays(seedNow, -28 + templateIndex),
                updatedAt: addDays(seedNow, -1)
            })
            personalHabitOwners.push({ student, studentIndex, templateIndex })
        })
    })

    console.log(`Creating ${personalHabitDocs.length} personal habits...`)
    const personalHabits = await Habit.create(personalHabitDocs)
    console.log(`Created ${personalHabits.length} personal habits.`)
    personalHabits.forEach((personalHabit, index) => {
        const owner = personalHabitOwners[index]
        const currentStreak = personalHabit.frequency === 'weekly'
            ? 1 + ((owner.studentIndex + owner.templateIndex) % 3)
            : 2 + ((owner.studentIndex + owner.templateIndex) % 8)
        const bestStreak = currentStreak + 2 + (owner.studentIndex % 4)

        queueProgress({
            user: owner.student,
            habitDoc: personalHabit,
            currentStreak,
            bestStreak,
            endDate: seedNow,
            seed: 500 + owner.studentIndex * 9 + owner.templateIndex,
            seedNow,
            checkinDocs,
            progressDocs,
            activitySources
        })
    })

    assertUniqueBy(
        checkinDocs,
        (checkin) => `${checkin.user}:${checkin.habit}:${checkin.periodKey}`,
        'checkin'
    )
    assertUniqueBy(
        progressDocs,
        (progress) => `${progress.user}:${progress.habit}`,
        'habit progress'
    )

    console.log(`Prepared ${checkinDocs.length} checkins and ${progressDocs.length} progress docs.`)
    if (checkinDocs.length > 0) await insertModelInChunks(Checkin, checkinDocs, 'checkins')
    if (progressDocs.length > 0) await insertModelInChunks(HabitProgress, progressDocs, 'progress docs')
    console.log(`Created ${checkinDocs.length} checkins and ${progressDocs.length} progress docs.`)

    const postDocs = []
    const usedPostImages = new Set()
    let postIndex = 0
    communitySpecs.forEach((community, communityIndex) => {
        const communityDoc = communities[communityIndex]
        const memberIds = acceptedMembersByCommunity.get(communityDoc._id.toString())
        const owner = managers[community.managerIndex]

        community.posts.forEach((post, localPostIndex) => {
            const imageUrl = imageForPost(postIndex)
            if (usedPostImages.has(imageUrl)) {
                throw new Error(`Duplicate post image generated for ${post.title}`)
            }
            usedPostImages.add(imageUrl)

            const authorId = localPostIndex === 0
                ? owner._id
                : memberIds[(localPostIndex * 7 + communityIndex) % memberIds.length]
            const challenge = post.challengeIndex === undefined
                ? null
                : challenges[communityIndex * 3 + post.challengeIndex]._id
            const createdAt = addDays(seedNow, -1 * (postIndex + 1))

            postDocs.push({
                community: communityDoc._id,
                author: authorId,
                title: post.title,
                body: post.body,
                imageUrl,
                challenge,
                eventDate: typeof post.eventOffset === 'number' ? addDays(seedNow, post.eventOffset) : null,
                pinned: Boolean(post.pinned),
                createdAt,
                updatedAt: createdAt
            })
            postIndex += 1
        })
    })

    await CommunityPost.insertMany(postDocs)
    console.log(`Created ${postDocs.length} community posts.`)

    activitySources.sort((left, right) => left.checkin.date - right.checkin.date)
    const activityDocs = activitySources.map((source, index) => ({
        _id: mongoose.Types.ObjectId.createFromTime(Math.floor(source.checkin.date.getTime() / 1000) + index),
        type: 'checkin',
        user: source.user._id,
        community: source.community._id,
        challenge: source.challenge._id,
        habit: source.habitDoc._id,
        checkin: source.checkin._id,
        revoked: false,
        feedVersion: 0,
        meta: {
            actorName: source.user.firstName || source.user.username || 'Someone',
            habitTitle: source.habitDoc.title,
            challengeTitle: source.challenge.title,
            streak: source.streak,
            frequency: source.habitDoc.frequency,
            periodKey: source.checkin.periodKey
        },
        createdAt: source.checkin.date,
        updatedAt: source.checkin.date
    }))

    if (activityDocs.length > 0) await insertCollectionInChunks(Activity.collection, activityDocs, 'feed activities')
    console.log(`Created ${activityDocs.length} feed activities.`)

    const syncedManagers = await syncManagerStripeSubscriptions({
        managerIds: managers.map((manager) => manager._id)
    })
    console.log(`Synced ${syncedManagers.length} manager Stripe subscriptions.`)

    console.log(`Seeded ${TARGET_DB_NAME}`)
    console.log(`Students: ${students.length} (${premiumStudentCount} premium)`)
    console.log(`Managers: ${managers.length}`)
    console.log(`Communities: ${communities.length}`)
    console.log(`Challenges: ${challenges.length}`)
    console.log(`Challenge habits: ${challengeHabits.length}`)
    console.log(`Community posts: ${postDocs.length} (${usedPostImages.size} unique image URLs)`)
    console.log(`Memberships: ${membershipDocs.length}`)
    console.log(`Challenge participations: ${participationDocs.length}`)
    console.log(`Checkins: ${checkinDocs.length}`)
    console.log(`Habit progress docs: ${progressDocs.length}`)
    console.log(`Feed activities: ${activityDocs.length}`)
    console.log(`Password for every mock account: ${PASSWORD}`)
    console.log('Useful demo accounts:')
    console.log('- manager@test.com / UserManager')
    console.log('- manager02@test.com / ManagerCampusLife')
    console.log('- premium@test.com / UserPremiumTest')
    console.log('- free@test.com / UserFreeTest')
}

if (process.argv.includes('--validate-only')) {
    validateSpecs()
    console.log('Seed spec is valid.')
    process.exit(0)
}

seed()
    .catch((error) => {
        console.error(error)
        process.exitCode = 1
    })
    .finally(async () => {
        await mongoose.disconnect()
    })
