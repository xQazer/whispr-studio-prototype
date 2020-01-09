import React from 'react';
import styled from 'styled-components';
import { useDragDispatch, useDragState } from './DragProvider';

const SelectionBox = styled.div`
  border: 1px dashed #000;
  position: absolute;
  z-index: 1000;
`

const RootDefault = styled.div`
  position: relative;
`


const selectionUpdateInterval = 50;

const DragSelectable =  props => {

  const ref = React.useRef();
  const childrenItems = Array.isArray(props.children) ? props.children : [props.children];

  const refs = React.useMemo(() => childrenItems.reduce((obj, el, i) => {
    const key = el.key || i;
    obj[key] = React.createRef();
    return obj;
  }, {}),[childrenItems]);

  const [mouseDown, setMouseDown] = React.useState(false);
  const [startPoint, setStartPoint] = React.useState();
  const [endPoint, setEndPoint] = React.useState();
  const [selectedItems,setSelectedItems] = React.useState([]);
  const [appendMode, setAppendMode] = React.useState(false);

  const [isDragging, setIsDragging] = React.useState(false);

  const nextSelectionUpdate = React.useRef(0);
  
  const dragState = useDragState();
  const dragDispatch = useDragDispatch();

  React.useEffect(()=>{
    dragDispatch({type:'SET_CONTAINER', payload: {ref, ...props}});

    return () => {
      dragDispatch({type: 'REMOVE_CONTAINER', payload: ref});
    }
  },[props]);

  React.useEffect(()=> {
    if(dragState.focus === ref) return;
    setSelectedItems([]);
  },[dragState.focus]);

  const setFocus = () => {
    ref !== dragState.focus && dragDispatch({ type: 'SET_FOCUS', payload: ref });
  }

  const itemDragStart = e => {
    let itemNode = null;
    let tmpNode = e.target;
    while(!itemNode){
      if(!tmpNode) break;
      if (!tmpNode.classList) continue;
      if (!Object.values(refs).some(ref => {
        return ref.current === tmpNode;
      })) {
        tmpNode = tmpNode.parentNode;
        continue;
      }
      itemNode = tmpNode;
      break;
    }

    const rect = itemNode.getBoundingClientRect();
    const offset = {
      x: e.clientX - rect.x,
      y: e.clientY - rect.y
    };

    const draggedItem = Object.entries(refs).find(([key, ref]) => {
      return ref.current === itemNode;
    })

    const draggedItemKey = typeof draggedItem == 'object' && draggedItem[0];

    let index = 0;
    const items = [];
    React.Children.forEach(childrenItems, (child) => {
      const tmpKey = child.key || String(index++);
      if (!selectedItems.includes(tmpKey) && tmpKey !== draggedItemKey) return;
      items.push({ node: child, key: tmpKey });
    });

    setIsDragging(true);
    dragDispatch({ type: 'BEGIN_DRAG', payload: { ref, start: { x: e.pageX, y: e.pageY }, dragOffset: offset, items } });
    setSelectedItems(items.map(e => e.key));
  }

  const onMouseDown = e => {

    setFocus();

    if(e.target.classList.contains('drag-handle')){
      itemDragStart(e);
      return;
    }

    if(e.button === 2 || e.nativeEvent.which === 2){
      return;
    }

    if(e.ctrlKey || e.altKey || e.shiftKey){
      setAppendMode(true);
    } else {
      
      if(e.target === ref.current){
        setSelectedItems([]);
      }
    }


    setMouseDown(true);
    setStartPoint({x: e.pageX, y: e.pageY});
  }

  const renderChildren = () => {
    let index = 0;

    return React.Children.map(childrenItems, child => {
      const tmpKey = child.key || String(index++);
      const isSelected = selectedItems.includes(tmpKey);

      const onClick =  e => {
        e.preventDefault();
        if (e.ctrlKey || e.altKey || e.shiftKey) {
          e.stopPropagation();

          const newSelectedItems = isSelected ? selectedItems.filter(key => key !== tmpKey) : [...selectedItems, tmpKey];
          setSelectedItems(newSelectedItems);
          return;
        }

        const newSelectedItems = isSelected ? selectedItems.filter(key => key !== tmpKey) : [tmpKey];
        setSelectedItems(newSelectedItems);
      }

      const isShadow = isSelected && isDragging;

      return React.cloneElement(child, {
        key: tmpKey,
        ref: refs[tmpKey],
        isSelected,
        isShadow,
        onClickCapture: onClick,
      })
    }) 
  }

  const getSelectionBoxRect = (endPoint) => {
    const node = ref.current;
    const left = Math.min(startPoint.x, endPoint.x) - node.offsetLeft;
    const top = Math.min(startPoint.y, endPoint.y) - node.offsetTop;
    const width = Math.abs(startPoint.x - endPoint.x);
    const height = Math.abs(startPoint.y - endPoint.y);

    return {left,top,width,height};
  }

  const renderSelectionBox = () => {
    if(!mouseDown || !endPoint || !startPoint){
      return null;
    }

    return (
      <SelectionBox key='selection-box' style={getSelectionBoxRect(endPoint)} />
    )
  }

  const boxIntersects = (a, b) => {
    return (a.left <= b.left + b.width &&
      a.left + a.width >= b.left &&
      a.top <= b.top + b.height &&
      a.top + a.height >= b.top)
  }

  React.useEffect(()=> {
    
    const onMouseUp = e => {
      setMouseDown(false);
      setStartPoint(null);
      setEndPoint(null);
      setAppendMode(false);
      setIsDragging(false);
    }
  
    const onMouseMove = e => {
      e.preventDefault();
      if(!mouseDown) return;

      const point = {x: e.pageX, y: e.pageY};
      setEndPoint(point);
      updateCollidingChildren(point);
    }

    const updateCollidingChildren = (endPoint) => {

      const now = new Date().getTime();
      if(nextSelectionUpdate.current > now || !mouseDown || !endPoint || !startPoint){
        return null;
      }
  
      nextSelectionUpdate.current = now + selectionUpdateInterval;
  
      let tmpNode = null;
      let tmpBox = null;
      let newSelected = appendMode ? selectedItems : [];
      Object.entries(refs).forEach(([key, ref]) => {
        tmpNode = ref.current;
        tmpBox = {
          top: tmpNode.offsetTop,
          left: tmpNode.offsetLeft,
          width: tmpNode.clientWidth,
          height: tmpNode.clientHeight,
        }
        if (boxIntersects(getSelectionBoxRect(endPoint), tmpBox)) {
          newSelected.push(key);
        } else {
          if (appendMode) return;
          newSelected = newSelected.filter(k => k !== key);
        }
      })

      if(newSelected.length === selectedItems.length){
        if(selectedItems.every((e,i) => {
          return e === newSelected[i];
        })) {
          return;
        }
      }

      setSelectedItems([...new Set(newSelected)]);
    }

    if(mouseDown || isDragging){
      window.document.addEventListener('mousemove', onMouseMove);
      window.document.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.document.removeEventListener('mousemove', onMouseMove);
      window.document.removeEventListener('mouseup', onMouseUp);
    }
  }, [mouseDown, isDragging, selectedItems.join(''), appendMode]);

  const {styledRoot, itemProps, style = {}, ...rest} = props;

  const Root = styledRoot || RootDefault;

  const children = React.useMemo(renderChildren, [refs, isDragging, selectedItems.join('')]);

  return (
    <Root {...rest} ref={ref} style={{position:'relative'}} onMouseDown={onMouseDown}>
      {children}
      {renderSelectionBox()}
    </Root>
  )
}

export default DragSelectable;