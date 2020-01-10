import React from 'react';
import DragSelectable, { DragSelectableItem } from './DragSelectable/DragSelectableContainer';
import { useDragDispatch } from './DragSelectable/Providers/DragProvider';
import styled from 'styled-components';
import { Heading, Pane, Text, Icon } from 'evergreen-ui';
// import { useDragSelectableState, useDragSelectableDispatch } from './DragSelectableProvider';


const TagItem = styled(Pane)`
  padding-right: 4px;
  margin-right: 4px;
  margin-bottom: 4px;
  background: #fff;
  display: flex;
  align-items: center;

  border-color: ${props => props.isSelected ? '#d9822b' : '#ddd'};
  background: ${props => props.isSelected ? '#fdf8f3' : '#fff'};

  opacity: ${props => props.isShadow ? 0.75 : 1};

  box-sizing: border-box;
  user-select: none;

  cursor: pointer;
`

const TagHandle = styled.div`
  height: 100%;
  padding: 8px 4px;
  cursor: grab;
`

const TagItemIcon = styled(Icon)`
  pointer-events: none;
`

const DragSelectableTags = ({children, onAdd, onRemove, onHighlightBegin, onHighlightEnd}) => {

  const ref = React.useRef();
  const dragDispatch = useDragDispatch();

  React.useEffect(() => {
    dragDispatch({ type: 'SET_CONTAINER', payload: { ref, onAdd, onRemove, onHighlightBegin, onHighlightEnd } });
  }, [ref, dragDispatch, onAdd, onRemove, onHighlightBegin, onHighlightEnd]);

  return (
    <DragSelectable ref={ref}>
      {children}
    </DragSelectable>
  )
}

export default DragSelectableTags;

export const TitledTag =  React.forwardRef(({title, subtitle, icon, ...props}, ref) => {
  return (
    <Tag ref={ref} {...props}>
      <Pane paddingLeft='6px' paddingRight='12px'>
        <Heading size={300}>{title}</Heading>
        <Text>{subtitle}</Text>
      </Pane>
      {icon && <Icon color='muted' icon={icon} />}
    </Tag>
  )
})

export const Tag = React.forwardRef((props, ref) => {
  return (
    <div ref={ref}>
      <TagItem border='muted' borderRadius={3} color='tint2' elevation={1} {...props}>
        <TagHandle className='drag-handle'>
          <TagItemIcon size={20} color='muted' icon='drag-handle-vertical' />
        </TagHandle>
        {props.children}
      </TagItem>
    </div>
  )
})