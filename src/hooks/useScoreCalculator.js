import { useState, useEffect } from 'react'
import { CHECKLIST_DATA } from '../data/checklistData'

export const useScoreCalculator = (checkedItems) => {
  const [totalScore, setTotalScore] = useState(0)
  const [timeframeScores, setTimeframeScores] = useState({})

  useEffect(() => {
    let totalPossible = 0
    let totalAchieved = 0
    const timeframeBreakdown = {}

    CHECKLIST_DATA.forEach((section) => {
      let sectionPossible = 0
      let sectionAchieved = 0

      section.items.forEach((item) => {
        sectionPossible += item.points
        if (checkedItems[item.id]) {
          sectionAchieved += item.points
        }
      })

      timeframeBreakdown[section.title] = {
        achieved: sectionAchieved,
        possible: sectionPossible,
        percentage:
          sectionPossible > 0
            ? Math.round((sectionAchieved / sectionPossible) * 100)
            : 0,
      }

      totalPossible += sectionPossible
      totalAchieved += sectionAchieved
    })

    const overallPercentage =
      totalPossible > 0 ? Math.round((totalAchieved / totalPossible) * 100) : 0

    setTotalScore(overallPercentage)
    setTimeframeScores(timeframeBreakdown)
  }, [checkedItems])

  return { totalScore, timeframeScores }
}
