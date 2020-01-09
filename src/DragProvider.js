import React from 'react';

import styled from 'styled-components';

const GhostItem = styled.div`
  position: absolute;
  top: -${props => props.layer * 3}px;
  left: -${props => props.layer * 3}px;
`

// Global selection
// Global items
// Containers

const maxStackSize = 3;

const initState = {containers:[]};
const DragStateContext = React.createContext();
const DragDispatchContext = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {

    case 'SET_CONTAINER': {

      // { ref, onAdd onRemove onHighlightBegin, onHighlightEnd } 
      const {ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd} = action.payload;
      const container = {ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd};
      return {
        ...state,
        containers: [container, ...state.containers].reduce((arr, item) => {
          if(arr.some(({ref}) => ref === item.ref)) return arr;
          arr.push(item);
          return arr;
        },[])
      }
    }

    case 'REMOVE_CONTAINER':
      // ref
      return {
        ...state,
        containers: state.containers.filter(e => e.ref !== action.payload)
      }

    case 'BEGIN_DRAG':

      const container = state.containers.find(({ref}) => {
        return ref === action.payload.ref;
      })
      typeof container.onHighlightBegin === 'function' && container.onHighlightBegin(action.payload.items);


      // { ref(owner), dragOffset, items: [{node,key}] }
      return {
        ...state,
        drag: {
          ...action.payload,
          fromContainer: container.ref
        }
      }

    case 'END_DRAG':
      return {
        ...state,
        drag: null
      }

    case 'SET_FOCUS':
      return {
        ...state,
        focus: action.payload
      }

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

const DragProvider = ({children}) => {
  const [state, dispatch] = React.useReducer(reducer, initState);
  return (
    <DragStateContext.Provider value={state}>
      <DragDispatchContext.Provider value={dispatch}>
        {children}
        {state.drag && <DragController state={state} dispatch={dispatch} />}
      </DragDispatchContext.Provider>
    </DragStateContext.Provider>
  )
}

const DragController = ({state, dispatch}) => {

  const [pos,setPos] = React.useState(state.drag.start);
  const selectedContainerRef = React.useRef(state.drag.fromContainer.current);

  const {dragOffset, items} = state.drag;

  const findContainerByRef = ref => {
    return state.containers.find(e => e.ref.current === ref.current);
  }

  const call = func => {
    typeof func === 'function' && func(items.map(item => item.node.props));
  }

  const onMouseMove = e => {
    const pos = {x: e.pageX, y: e.pageY};
    setPos(pos);

    const currSelected = state.containers.find(container => {
      return (intersects(pos, container.ref))
    });

    if(!currSelected) return;

    if(currSelected.ref !== selectedContainerRef){
      const oldSelected = findContainerByRef(selectedContainerRef);
      call(oldSelected.onHighlightEnd);
      call(currSelected.onHighlightBegin);
      selectedContainerRef.current = currSelected.ref.current;
    }
  }

  const intersects = (pos, ref) => {
    const { x, y } = pos;
    const node = ref.current;
    const top = node.offsetTop;
    const left = node.offsetLeft;
    const width = node.clientWidth;
    const height = node.clientHeight;

    return (
      x > left && x < left + width &&
      y > top && y < top + height
    )
  }

  const onMouseUp = e => {
    
    const pos = {x: e.pageX, y: e.pageY};
    dispatch({type:'END_DRAG'});
    
    const currSelected = state.containers.find(container => {
      return (intersects(pos, container.ref))
    });
    setPos(null);

    if(!currSelected) return;

    if(currSelected.ref !== state.drag.fromContainer) {
      const fromContainer = findContainerByRef(state.drag.fromContainer);
      call(fromContainer.onRemove);
      call(currSelected.onAdd);
    }
  }

  React.useEffect(()=> {

    window.document.addEventListener('mousemove', onMouseMove);
    window.document.addEventListener('mouseup', onMouseUp);

    return () => {
      window.document.removeEventListener('mousemove', onMouseMove);
      window.document.removeEventListener('mouseup', onMouseUp);
    }

  },[]);

  if(!pos) return null;

  return (
    <div style={{
      position: 'absolute',
      top: pos.y - dragOffset.y,
      left: pos.x - dragOffset.x
    }}>
      
      {items.slice(0, maxStackSize).map(({node}, index) => {
        return (
          <GhostItem key={index} layer={index}>
            {React.cloneElement(node, { isSelected: true })}
          </GhostItem>
        )
      })}
      {items[0].node}
    </div>
  )
}

function useDragState() {
  const context = React.useContext(DragStateContext);
  if (context === undefined) {
    throw new Error('useState must be used within a DragProvider');
  }
  return context;
}
function useDragDispatch() {
  const context = React.useContext(DragDispatchContext);
  if (context === undefined) {
    throw new Error('useDispatch must be used within a DragProvider');
  }
  return context;
}
export {DragProvider, useDragState, useDragDispatch};