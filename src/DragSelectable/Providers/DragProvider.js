import React from 'react';
import ReactDOM from 'react-dom';

import styled from 'styled-components';

const GhostItem = styled.div`
  position: absolute;
  top: -${props => props.layer * 3}px;
  left: -${props => props.layer * 3}px;
`

// . Rerender on selection change expensive
// , change callback handling? (statable, rejectable)
// . selected/highlighted set in state
// combine container types 

const maxStackSize = 3;

const initState = {containers:[], items:{}, selected: []};
const DragStateContext = React.createContext();
const DragDispatchContext = React.createContext();

const reducer = (state, action) => {
  switch (action.type) {

    case 'SET_CONTAINER': {

      // { ref, onAdd onRemove onHighlightBegin, onHighlightEnd } 
      const {ref, onAdd, onRemove, priority = 0} = action.payload;
      const container = {ref, onAdd, onRemove, priority};

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
        containers: state.containers.filter(e => e.ref !== action.payload),
        items: Object.entries(state.items).reduce((obj, [key, value]) => {
          if(value.containerRef === action.payload) return obj;
          obj[key] = value;
          return obj;
        }, {})
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

    case 'ADD_CONTAINER_ITEM': {
      // {key, ref, node}
      const {key, ref, containerRef, node} = action.payload;
      
      return {
        ...state,
        items: {
          ...state.items,
          [key]: {key, ref, containerRef, node}
        }
      }
    }

    case 'REMOVE_CONTAINER_ITEM': {
      // { key, containerRef }
      const newItems = Object.entries(state.items).reduce((obj, [key, value]) => {
        if(key === action.payload.key && value.containerRef === action.payload.containerRef) return obj;
        obj[key] = value;
        return obj;
      }, {});

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

          if(!value.ref.current) {
            console.log('Selection item without a null ref found! key:', key);
          }

          obj[key] = {
            ...value,
            rect: getElPageRect(value.ref.current)
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
        containers: state.containers.map(e => ({ ...e, rect: getElPageRect(e.ref.current) })),
        drag: {
          ...action.payload,
          shadows: shadows.reverse(),
          items: selected
        }
      }

    case 'END_DRAG':
      return {
        ...state,
        drag: null,
        highlighted: null
      }


    case 'CALC_RECT':
      return {
        ...state,
        containers: state.containers.map(e => ({ ...e, rect: getElPageRect(e.ref.current) })),
        items: Object.entries(state.items).reduce((obj, [key, value]) => {
          if(!value.ref.current) {
            console.log('Selection item without a null ref found! key:', key);
          }
          obj[key] = {
            ...value,
            rect: getElPageRect(value.ref.current)
          }
          return obj;
        }, {})
      }

    case 'SET_HIGHLIGHTED':
      return {
        ...state,
        highlighted: action.payload
      }

    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

export const DragProvider = ({children}) => {

  const [state, dispatch] = React.useReducer(reducer, initState);

  return (
    <DragStateContext.Provider value={state}>
      <DragDispatchContext.Provider value={dispatch}>
        {children}
        <DragController />
        <SelectionController />
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
const SelectionController = props => {

  const [state,dispatch] = useDragContext();

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

    window.document.addEventListener('mouseup', onMouseUp);

    return () => {
      window.document.removeEventListener('mouseup', onMouseUp);
    }
  }, []);

  React.useEffect(()=> {
  
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

      Object.entries(state.items).forEach(([_, { key, rect }]) => {
        if (boxIntersects(selectionRect, rect)) {
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

      // const _selected = [...new Set(newSelected)];
      dispatch({type:'SET_SELECTED', payload: [...new Set(newSelected)]});
      // setSelectedItems([...new Set(newSelected)]);
    }

    if(mouseDown){
      window.document.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      window.document.removeEventListener('mousemove', onMouseMove);
    }
  }, [mouseDown, selected.join(''), itemsDep]);

  if(!endPoint) return null;
  if(!state.startPoint) return null;

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

const intersects = (pos, rect) => {
  const { x, y } = pos;
  const {top, left, width, height} = rect;

  return (
    x > left && x < left + width &&
    y > top && y < top + height
  )
}

const getSelectedContainer = (containers, mousePos) => {
  const intersectedContainers = containers.filter(({rect}) => {
    return (intersects(mousePos, rect))
  })

  return intersectedContainers && intersectedContainers.sort((a,b) => b.priority - a.priority)[0];
}

const DragController = props => {
  const [state,dispatch] = useDragContext();

  const [pos,setPos] = React.useState();
  const selectedContainerRef = React.useRef(null);


  const onMouseMove = e => {
    const pos = {x: e.pageX, y: e.pageY};
    setPos(pos);

    const currSelected = getSelectedContainer(state.containers, pos);
    const currContainerEl = currSelected && currSelected.ref.current;
    
    if(currContainerEl !== selectedContainerRef.current){
      dispatch({type:'SET_HIGHLIGHTED', payload: currSelected && currSelected.ref});
      selectedContainerRef.current = currContainerEl;
    }
  }

  const onMouseUp = e => {

    const pos = {x: e.pageX, y: e.pageY};
    dispatch({type:'END_DRAG'});

    const currSelected = getSelectedContainer(state.containers, pos);
    
    setPos(null);

    if(!currSelected) return;

    const containerItems = state.drag.items.map(key => state.items[key]);
    const containers = containerItems.reduce((arr, {containerRef}) => {
      if(arr.includes(containerRef) || currSelected.ref === containerRef) return arr;
      arr.push(containerRef);
      return arr;
    }, []);

    let wasModified = false;

    let removeCalls = [];
    containers.forEach(containerRef => {

      const container = state.containers.find(({ref}) => ref === containerRef);

      const removeItems = containerItems.filter(({containerRef: cRef}) => cRef === containerRef).map(({node}) => {
        return node.props;
      })
      if(removeItems.length > 0){
        wasModified = true;
        removeCalls.push(()=> {
          container.onRemove(removeItems);
        })
      }
    })

    const targetCotainer = state.containers.find(({ref}) => ref === currSelected.ref);

    const addItems = containerItems.filter(({containerRef}) => containerRef !== targetCotainer.ref).map(({node}) => {
      return node.props;
    })
    
    if(addItems.length > 0){
      wasModified = true;
      targetCotainer.onAdd(addItems, () => {
        removeCalls.forEach(fn => fn());
      });
    }

    if(wasModified){
      dispatch({type:'SET_SELECTED', payload:[]});
    }
  }

  React.useEffect(()=> {

    if(state.drag){
      setPos(state.drag.start);
      window.document.addEventListener('mousemove', onMouseMove);
      window.document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.document.removeEventListener('mousemove', onMouseMove);
      window.document.removeEventListener('mouseup', onMouseUp);
    }

  },[state.drag]);

  if(!pos) return null;
  if(!state.drag) return null;
  const {dragOffset, shadows} = state.drag;

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

export const useDragContext = () => {
  return [useDragState(), useDragDispatch()];
}

export const useDragState = () => {
  const context = React.useContext(DragStateContext);
  if (context === undefined) {
    throw new Error('useDragState must be used within a DragProvider');
  }
  return context;
}

export const useDragDispatch = () => {
  const context = React.useContext(DragDispatchContext);
  if (context === undefined) {
    throw new Error('useDragDispatch must be used within a DragProvider');
  }
  return context;
}

export const getSelectedItems = state => {
  return state.selected.map((key) => {
    return state.items[key];
  })
}

const getElPageRect = el => {
  const clientRect = el.getBoundingClientRect();
  return { top: clientRect.top + window.pageYOffset, left: clientRect.left + window.pageXOffset, width: clientRect.width, height: clientRect.height };
}