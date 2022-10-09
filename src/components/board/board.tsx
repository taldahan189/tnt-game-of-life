import _ from 'lodash'
import { FunctionComponent, useEffect, useState } from 'react'
import { imageOptions } from '../../services/image.options'
import { pusherService } from '../../services/pusher.service'
import { UserInfo } from '../user-info/user-info'
import './board.scss'

type BoardProps = {
  title: string
}

export const Board: FunctionComponent<BoardProps> = ({ title }) => {
  const INTERVAL_IN_MS = 250
  const numOfRows = 30
  const numOfColumns = 50
  const numOfFirstGerms = 100
  const [pos, setPos] = useState([] as number[])
  const [re, setRe] = useState(false)
  const [getGermsOnBoard, setGermsOnBoard] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentIdx, setIndex] = useState<number>(0)
  const [answers, setAnswers] = useState<{ index: number; text: string }[]>([])
  const imageOpts = imageOptions

  useEffect(() => {
    const ps = _.times(numOfColumns * numOfRows, _.constant(0))
    setPos(ps)
  }, [setPos])

  useEffect(() => {
    const channel = pusherService.getChannel()
    channel.bind(
      'client-answer',
      function (data: { answer: string; userName: string }) {
        console.log(data)
        // alert(JSON.stringify(data))
        // setAnswers(data)
        // setAnswerSent(false)
      }
    )
  }, [])

  const publishOptions = (index?: number) => {
    const data = imageOptions[index || currentIdx]
    const options: { index: number; text: string }[] = _.map(
      data.options,
      (it, index) => {
        return { index, text: it }
      }
    )
    debugger
    pusherService.publishOptions(options)
    setIndex(1);
  }

  const setLife = (row: number, col: number) => {
    if (pos[col + row * numOfColumns] === 1) {
      setGermsOnBoard(getGermsOnBoard - 1)
      pos[col + row * numOfColumns] = 0
    } else {
      if (getGermsOnBoard < numOfFirstGerms) {
        pos[col + row * numOfColumns] = 1
        setGermsOnBoard(getGermsOnBoard + 1)
        setPos(pos)
        setRe(!re)
      }
    }
  }

  const getGermsCount = () => {
    const c = _.countBy(pos, (it) => it === 1)
    return numOfFirstGerms - (c['true'] || 0) >= 0
      ? numOfFirstGerms - (c['true'] || 0)
      : 0
  }
  const getGermsOnBoardCount = () => {
    const c = _.countBy(pos, (it) => it === 1)
    return c['true'] || 0
  }

  const getColumns = (row: number) => {
    const columns = _.range(0, numOfColumns)
    return columns.map((val, index) => {
      return (
        <div
          className={`column ${
            pos[index + row * numOfColumns] === 1 ? 'full' : 'empty'
          }`}
          key={index}
          onClick={() => setLife(row, index)}
        >
          {/* {pos[index + row * numOfColumns]} */}
        </div>
      )
    })
  }

  const getboard = () => {
    const rows = _.range(0, numOfRows)
    return rows.map((val, index) => {
      return (
        <div className='row' key={index}>
          {getColumns(val)}
        </div>
      )
    })
  }

  const startGame = () => {
    publishOptions(0);
    startTheTimer()
  }

  const startTheTimer = () => {
    setInterval(() => updateStepByMs(), INTERVAL_IN_MS)
  }

  const updateStepByMs = () => {
    setCurrentTime((currentTime) => currentTime + INTERVAL_IN_MS)
    let oldPos = [...pos]
    for (let i = 0; i < pos.length; i++) {
      pos[i] = getGremScope(i, oldPos)
    }

    // if (!_.find(pos, 1)) {
    //   console.log('res', pos)
    //   setRandom()
    //   return;
    // }
    setPos([...pos])
  }

  const setRandom = () => {
    const res = [...pos]
    _.forEach(_.range(0, 20), (it) => {
      const place = _.random(numOfColumns * numOfRows)
      res[place] = 1
      res[place + 1] = 1
      res[place + 2] = 1
      res[place + 3] = 1
      res[place + numOfColumns + 1] = 1
      res[place + numOfColumns + 2] = 1
      res[place + numOfColumns + 3] = 1
      res[place + numOfColumns - 2] = 1
      res[place + numOfColumns - 1] = 1
    })

    setPos(res)
  }

  const getGremScope = (gremPos: number, oldPos: number[]) => {
    /*
      p1   p2  p3
      p4   X   p5
      p6   p7  p8
    */

    const p1 = oldPos[gremPos - numOfColumns - 1] || 0
    const p2 = oldPos[gremPos - numOfColumns] || 0
    const p3 = oldPos[gremPos - numOfColumns + 1] || 0
    const p4 = oldPos[gremPos - 1] || 0
    const p5 = oldPos[gremPos + 1] || 0
    const p6 = oldPos[gremPos + numOfColumns - 1] || 0
    const p7 = oldPos[gremPos + numOfColumns] || 0
    const p8 = oldPos[gremPos + numOfColumns + 1] || 0

    const totalGremsInScope = p1 + p2 + p3 + p4 + p5 + p6 + p7 + p8
    return calculatePixelByRules(oldPos[gremPos], totalGremsInScope)
  }

  const calculatePixelByRules = (currentPixel: number, totalScope: number) => {
    if (currentPixel === 1) {
      if (totalScope === 0 || totalScope === 1 || totalScope >= 4) {
        return 0
      } else {
        // 2 or 3 neighbors -> survive
        return 1
      }
    } else {
      if (totalScope === 3 || totalScope === 4) {
        return 1
      } else {
        return 0
      }
    }
  }

  return (
    <div className='board-wrapper'>
      <h2>{title}</h2>
      <h3>Time: {currentTime / 1000}</h3>
      <div className='user-info-container'>
        <UserInfo
          germs={getGermsCount()}
          food={20}
          bombs={10}
          germsOnBoard={getGermsOnBoardCount()}
          name={'user1'}
        ></UserInfo>
      </div>
      <div className='board'>{getboard()}</div>
      {/* {getGermsOnBoard === numOfFirstGerms && ( */}
      {currentIdx === 0 && <div className='start-game' onClick={() => startGame()}>
        start game
      </div>}
      {currentIdx > 0 && <div className='start-game' onClick={() => publishOptions()}>
        next
      </div>}
      {/* )} */}
    </div>
  )
}
