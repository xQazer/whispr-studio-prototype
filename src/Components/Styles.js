import styled from "styled-components";
import { Pane } from "evergreen-ui";

export const PaneHighlight = styled(Pane)`
  background: ${props => props.isHighlighted ? '#fef8e7' : '#fff'};
`

export const ViewHeader = styled.div`
  display:flex;
  padding: 12px 16px;
`

export const ScrollList = styled.div`
  overflow: scroll;
  height: ${props => `calc(100% - ${props.px || 0}px)`};
`

export const TagContainer = styled.div`
  min-height: 77px;
  background: #00000018;
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  box-sizing:border-box;
`