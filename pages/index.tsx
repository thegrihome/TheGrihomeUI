import { useDispatch, useSelector } from 'react-redux'
import { increment, decrement } from '@/store/slices/counterSlice'
import { RootState } from '@/store/store'

export default function Home() {
  const count = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-3xl mb-4">Counter: {count}</h1>
      <div className="space-x-4">
        <button onClick={() => dispatch(increment())} className="px-4 py-2 bg-green-500 text-white rounded">
          Increment
        </button>
        <button onClick={() => dispatch(decrement())} className="px-4 py-2 bg-red-500 text-white rounded">
          Decrement
        </button>
      </div>
    </div>
  )
}