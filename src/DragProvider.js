import React from 'react';
import ReactDOM from 'react-dom';

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

const initState = {containers:[], items:{}, selected: []};
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

    case 'SET_CONTAINER_ITEMS': {

      // items: [{key, ref, node}];
      const {containerRef, items} = action.payload;

      const withoutContainerItems = Object.entries(state.items).reduce((obj, [key, value]) => {
        if(value.containerRef === containerRef) return obj;
        obj[key] = value;
        return obj;
      }, {});

      const newItems = items.reduce((obj, value) => {
        obj[value.key] = {...value, containerRef};
        return obj;
      }, withoutContainerItems);

      return {
        ...state,
        items: newItems
      }
    }

    case 'BEGIN_SELECTION': {
      // e: MouseEvent

      const {point, appendMode, target} = action.payload;

      let selected = state.selected;
      if(!appendMode && state.containers.some(container => container.ref.current === target)) {
        selected = [];
      }

      return {
        ...state,
        startPoint: point,
        selected,
        items: Object.entries(state.items).reduce((obj, [key, value]) => {
          obj[key] = {
            ...value,
            rect: value.ref.current.getBoundingClientRect()
          }
          return obj;
        }, {})
      }
    }

    case 'END_SELECTION': {
      return {
        ...state,
        startPoint: null
      }
    }

    case 'SET_SELECTED': {
      return {
        ...state,
        selected: action.payload
      }
    }

    case 'ADD_SELECT': {
      if(state.selected.includes(action.payload)) return state;
      return {
        ...state,
        selected: [...state.selected, action.payload]
      }
    }

    case 'REMOVE_SELECT': {
      return {
        ...state,
        selected: state.selected.filter(e => e !== action.payload)
      }
    }

    case 'BEGIN_DRAG':

      // const container = state.containers.find(({ref}) => {
      //   return ref === action.payload.ref;
      // })

      // typeof container.onHighlightBegin === 'function' && container.onHighlightBegin(action.payload.items);

      const {draggedItemKey} = action.payload;

      const shadows = Object.values(state.items).reduce((arr, {key, ref, node}) => {
        if(key === draggedItemKey) return [node, ...arr];
        if(state.selected.includes(key)) return [...arr, node];
        return arr;
      }, []).slice(0, maxStackSize);

      const selected = [...new Set([draggedItemKey, ...state.selected])]

      return {
        ...state,
        selected,
        drag: {
          ...action.payload,
          shadows: shadows.reverse(),
          items: selected
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
        {state.startPoint && <SelectionController state={state} dispatch={dispatch} />}
      </DragDispatchContext.Provider>
    </DragStateContext.Provider>
  )
}

const SelectionBox = styled.div`
  border: 1px dashed #000;
  position: absolute;
  z-index: 1000;
`

const selectionUpdateInterval = 50;
const SelectionController = ({state, dispatch}) => {

  const {startPoint, selected, items} = state;

  const [endPoint, setEndPoint] = React.useState();

  const nextSelectionUpdate = React.useRef(0);

  const mouseDown = !!state.startPoint;
  const itemsDep = Object.values(state.items).map(e => e.key).join('');

  React.useEffect(()=> {
    
    const onMouseUp = e => {
      dispatch({type:'END_SELECTION'});
      setEndPoint(null);
    }
  
    const onMouseMove = e => {
      e.preventDefault();
      if(!mouseDown) return;

      const point = {x: e.pageX, y: e.pageY};
      setEndPoint(point);
      updateCollidingChildren(e);
    }

    const updateCollidingChildren = (e) => {

      const endPoint = {x: e.pageX, y: e.pageY};
      
      const now = new Date().getTime();
      if(nextSelectionUpdate.current > now || !mouseDown || !endPoint){
        return null;
      }
      nextSelectionUpdate.current = now + selectionUpdateInterval;    
      
      const appendMode = isEventAppendMode(e);
      let newSelected = appendMode ? [...selected] : [];
      const selectionRect = getSelectionBoxRect(startPoint, endPoint);

      Object.entries(state.items).forEach(([key, {rect}]) => {
        const {width, height, top, left} = rect;
        const coords = {width, height, top: top + window.pageYOffset, left: left + window.pageXOffset};
        if (boxIntersects(selectionRect, coords)) {
          newSelected.push(key);
        } else {
          if (!appendMode){
            newSelected = newSelected.filter(k => k !== key);
          }
        }
      })

      if(newSelected.length === selected.length){
        if(selected.every((e,i) => {
          return e === newSelected[i];
        })) {
          return;
        }
      }

      dispatch({type:'SET_SELECTED', payload: newSelected});
      // setSelectedItems([...new Set(newSelected)]);
    }

    if(mouseDown){
      window.document.addEventListener('mousemove', onMouseMove);
      window.document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.document.removeEventListener('mousemove', onMouseMove);
      window.document.removeEventListener('mouseup', onMouseUp);
    }
  }, [mouseDown, selected.join(''), itemsDep]);

  if(!endPoint) return null;

  return ReactDOM.createPortal(
    <SelectionBox style={getSelectionBoxRect(startPoint, endPoint)} />,
    document.body
  )
}

const boxIntersects = (a, b) => {
  return (a.left <= b.left + b.width &&
    a.left + a.width >= b.left &&
    a.top <= b.top + b.height &&
    a.top + a.height >= b.top)
}

const getSelectionBoxRect = (startPoint, endPoint) => {
  const left = Math.min(startPoint.x, endPoint.x);
  const top = Math.min(startPoint.y, endPoint.y);
  const width = Math.abs(startPoint.x - endPoint.x);
  const height = Math.abs(startPoint.y - endPoint.y);

  return {left,top,width,height};
}

const DragController = ({state, dispatch}) => {

  const [pos,setPos] = React.useState(state.drag.start);
  const selectedContainerRef = React.useRef(null);

  const {dragOffset, items, shadows} = state.drag;

  const findContainerByRef = ref => {
    return state.containers.find(e => e.ref.current === ref.current);
  }

  const call = func => {
    const itemProps = Object.values(state.items).reduce((arr, {key, node}) => {
      if(!items.includes(key)) return arr;
      arr.push(node.props);
      return arr;
    }, []);
    typeof func === 'function' && func(itemProps);
  }

  const onMouseMove = e => {
    const pos = {x: e.pageX, y: e.pageY};
    setPos(pos);

    const currSelected = state.containers.find(container => {
      return (intersects(pos, container.ref))
    });

    if(!currSelected) return;

    if(currSelected.ref !== selectedContainerRef){
      if(selectedContainerRef.current){
        const oldSelected = findContainerByRef(selectedContainerRef);
        call(oldSelected.onHighlightEnd);
      }
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

    const containerItems = state.drag.items.map(key => state.items[key]);

    const containers = containerItems.reduce((arr, {containerRef}) => {
      if(arr.includes(containerRef) || currSelected.ref === containerRef) return arr;
      arr.push(containerRef);
      return arr;
    }, []);

    let wasModified = false;

    containers.forEach(containerRef => {

      const container = state.containers.find(({ref}) => ref === containerRef);

      const removeItems = containerItems.filter(({containerRef: cRef}) => cRef === containerRef).map(({node}) => {
        return node.props;
      })
      if(removeItems.length > 0){
        wasModified = true;
        container.onRemove(removeItems);
      }
    })

    const targetCotainer = state.containers.find(({ref}) => ref === currSelected.ref);

    const addItems = containerItems.filter(({containerRef}) => containerRef !== targetCotainer.ref).map(({node}) => {
      return node.props;
    })
    
    if(addItems.length > 0){
      wasModified = true;
      targetCotainer.onAdd(addItems);
    }

    if(wasModified){
      dispatch({type:'SET_SELECTED', payload:[]});
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
      {shadows.map((node, index) => {
        return (
          <GhostItem key={index} layer={index}>
            {React.cloneElement(node, { isSelected: true })}
          </GhostItem>
        )
      })}
    </div>
  )
}

export const isEventAppendMode = e => {
  return e.ctrlKey || e.altKey || e.shiftKey;
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